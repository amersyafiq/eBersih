
from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy import and_, case, func
from ..models import Zone, Building, Block, Floor, Space, GASchedule, Assignment, Task, User, Company
from ..schemas import BuildingDetailsResponse, CleanerNode, FacilityNode

def get_buildings_status(db, campus_code, schedule_date):
    
    assignment_stats = (
        db.query(
            Block.BuildingID,
            func.count(Assignment.AssignID).label("TotalAssignments"),
            func.coalesce(func.sum(case((Assignment.Status == 'Completed', 1), else_=0)), 0).label("TotalCompletedAssignments"),
            func.count(func.distinct(Assignment.CleanerID)).label("TotalCleaners")
        ) \
        .select_from(Assignment) \
        .join(GASchedule, Assignment.ScheduleID == GASchedule.ScheduleID) \
        .join(Space, Assignment.SpaceID == Space.SpaceID) \
        .join(Floor, Space.FloorID == Floor.FloorID) \
        .join(Block, Floor.BlockID == Block.BlockID) \
        .filter(GASchedule.ScheduleDate == schedule_date) \
        .group_by(Block.BuildingID) \
        .subquery()
    )

    results = (
        db.query(
            Building.CampusCode,
            Zone.ZoneCode,
            Zone.ZoneName,
            Building.BuildingCode,
            Building.BuildingName,
            func.coalesce(assignment_stats.c.TotalAssignments, 0).label("TotalAssignments"),
            func.coalesce(assignment_stats.c.TotalCompletedAssignments, 0).label("TotalCompletedAssignments"),
            func.coalesce(assignment_stats.c.TotalCleaners, 0).label("TotalCleaners")
        ) \
        .join(Zone, Building.ZoneID == Zone.ZoneID) \
        .outerjoin(assignment_stats, Building.BuildingID == assignment_stats.c.BuildingID) \
        .filter(
            Building.IsActive == True,
            Building.CampusCode == campus_code
        ) \
        .all()
    )
    
    return results

def get_building_details(db, building_code, campus_code, schedule_date):
    
    building = (
        db.query(Building)
        .filter(
            Building.BuildingCode == building_code,
            Building.CampusCode == campus_code,
            Building.IsActive == True,
        )
        .first()
    )
    if not building: raise HTTPException(status_code=404, detail="Building not found.")

    facility_rows = (
        db.query(
            Block.BlockID,
            Block.BlockCode,
            Block.BlockName,
            Floor.FloorID,
            Floor.FloorCode,
            Floor.FloorName,
            Space.SpaceID,
            Space.SpaceCode,
            Space.SpaceName,
        )
        .select_from(Block)
        .outerjoin(Floor, (Floor.BlockID == Block.BlockID) & (Floor.IsActive == True))
        .outerjoin(Space, (Space.FloorID == Floor.FloorID) & (Space.IsActive == True))
        .filter(
            Block.BuildingID == building.BuildingID,
            Block.IsActive == True,
        )
        .order_by(Block.BlockCode, Floor.FloorCode, Space.SpaceCode)
        .all()
    )

    assignment_rows = (
        db.query(
            Assignment.AssignID,
            Assignment.Status,
            Assignment.SpaceID,
            Space.SpaceCode,
            Space.SpaceName,
            Task.TaskID,
            Task.TaskName,
            User.UserID.label("CleanerID"),
            User.Fullname.label("CleanerName"),
            User.Category.label("CleanerCategory"),
            Company.CompanyName,
        )
        .select_from(Assignment)
        .join(GASchedule, Assignment.ScheduleID == GASchedule.ScheduleID)
        .join(Space, Assignment.SpaceID == Space.SpaceID)
        .join(Floor, Space.FloorID == Floor.FloorID)
        .join(Block, Floor.BlockID == Block.BlockID)
        .outerjoin(Task, Assignment.TaskID == Task.TaskID)
        .join(User, Assignment.CleanerID == User.UserID)
        .outerjoin(Company, User.CompanyID == Company.CompanyID)
        .filter(
            Block.BuildingID == building.BuildingID,
            GASchedule.ScheduleDate == schedule_date,
        )
        .order_by(User.Fullname, Space.SpaceCode)
        .all()
    )

    tasks_by_space = defaultdict(list)
    for assignment in assignment_rows:
        tasks_by_space[assignment.SpaceID].append(
            FacilityNode(
                id=assignment.AssignID,
                name=assignment.TaskName,
                type='task',
                status=assignment.Status,
                cleanerName=assignment.CleanerName,
            )
        )

    # Facility Data
    blocks_map = {}
    floors_map = {}
    spaces_seen = set()
    for facility in facility_rows:
        if facility.BlockID not in blocks_map:
            blocks_map[facility.BlockID] = FacilityNode(
                id=facility.BlockID,
                code=facility.BlockCode,
                name=facility.BlockName,
                type='block',
                subRows=[],
            )
        block_node = blocks_map[facility.BlockID]
        
        if facility.FloorID is not None:
            if facility.FloorID not in floors_map:
                floor_node = FacilityNode(
                    id=facility.FloorID,
                    code=facility.FloorCode,
                    name=facility.FloorName,
                    type='floor',
                    subRows=[]
                )
                floors_map[facility.FloorID] = floor_node
                block_node.subRows.append(floor_node)
            else:
                floor_node = floors_map[facility.FloorID]

            if facility.SpaceID is not None and facility.SpaceID not in spaces_seen:
                spaces_seen.add(facility.SpaceID)
                space_task = tasks_by_space.get(facility.SpaceID, [])
                space_node = FacilityNode(
                    id=facility.SpaceID,
                    code=facility.SpaceCode,
                    name=facility.SpaceName,
                    type='space',
                    subRows=space_task
                )
                floor_node.subRows.append(space_node)

    facility_data = list(blocks_map.values())

    # Cleaner Data
    cleaners_map = {}
    for assignment in assignment_rows:
        if assignment.CleanerID not in cleaners_map:
            cleaners_map[assignment.CleanerID] = CleanerNode(
                id=assignment.CleanerID,
                type="cleaner",
                cleanerName=assignment.CleanerName,
                category=assignment.CleanerCategory or "General",
                company=assignment.CompanyName or "In-House",
                subRows=[],
            )

        cleaners_map[assignment.CleanerID].subRows.append(
            CleanerNode(
                id=assignment.AssignID,
                type="assignment",
                taskName=assignment.TaskName or "Work Order / Ad-hoc Task",
                spaceCode=assignment.SpaceCode,
                spaceName=assignment.SpaceName,
                status=assignment.Status,
            )
    )

    cleaner_data = list(cleaners_map.values())

    return BuildingDetailsResponse(
        buildingCode=building.BuildingCode,
        buildingName=building.BuildingName,
        scheduleDate=str(schedule_date),
        facilityData=facility_data,
        cleanerData=cleaner_data,
    )
            

                

    
