from sqlalchemy import true

from ..models import Campus, Zone, Building, Block, Floor, Space
from ..schemas import FacilityTableResponse
from fastapi import HTTPException, status
from sqlalchemy.orm import joinedload

# Campus
def get_campuses(db):
    return db.query(Campus).all()

def get_campus(db, campus_code):
    campus = db.query(Campus).filter(Campus.CampusCode == campus_code).first()
    if not campus: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Campus {campus_code} not found")
    return campus


# Zone
def get_zones(db, campus_code):
    zones = db.query(Zone).filter(Zone.CampusCode == campus_code, Zone.IsActive == True).all()
    if not zones: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Zones for {campus_code} not found")
    return zones

def get_zone(db, zone_id):
    zone = db.query(Zone).filter(Zone.ZoneID == zone_id).first()
    if not zone: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Zone not found")
    return zone


# Building
def get_buildings(db, campus_code, zone_code):
    buildings = db.query(Building).join(
        Zone, Building.ZoneID == Zone.ZoneID, isouter=True
    ).filter(
        Zone.CampusCode == campus_code,
        Zone.ZoneCode == zone_code
    ).all()
    if not buildings: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Building not found")
    return buildings

def get_building(db, building_id):
    building = db.query(Building).filter(Building.BuildingID == building_id).first()
    if not building: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Building not found")
    return building


# Block
def get_blocks(db, campus_code, zone_code, building_code):
    blocks = db.query(Block).join(
        Building, Block.BuildingID == Building.BuildingID
    ).join(
        Zone, Building.ZoneID == Zone.ZoneID, isouter=True
    ).filter(
        Zone.CampusCode == campus_code,
        Zone.ZoneCode == zone_code,
        Building.BuildingCode == building_code
    ).all()
    if not blocks: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Block not found")
    return blocks

def get_block(db, block_id):
    block = db.query(Block).filter(Block.BlockID == block_id).first()
    if not block: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Block not found")
    return block


# Floor
def get_floors(db, campus_code, zone_code, building_code, block_code):
    floors = db.query(Floor).join(
        Block, Floor.BlockID == Block.BlockID
    ).join(
        Building, Block.BuildingID == Building.BuildingID
    ).join(
        Zone, Building.ZoneID == Zone.ZoneID, isouter=True
    ).filter(
        Zone.CampusCode == campus_code,
        Zone.ZoneCode == zone_code,
        Building.BuildingCode == building_code,
        Block.BlockCode == block_code
    ).all()
    if not floors: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Floor not found")
    return floors

def get_floor(db, floor_id):
    floor = db.query(Floor).filter(Floor.FloorID == floor_id).first()
    if not floor: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Floor not found")
    return floor


# Space
def get_spaces(db, campus_code, zone_code, building_code, block_code, floor_code):
    spaces = db.query(Space).join(
        Floor, Space.FloorID == Floor.FloorID
    ).join(
        Block, Floor.BlockID == Block.BlockID
    ).join(
        Building, Block.BuildingID == Building.BuildingID
    ).join(
        Zone, Building.ZoneID == Zone.ZoneID, isouter=True
    ).filter(
        Zone.CampusCode == campus_code,
        Zone.ZoneCode == zone_code,
        Building.BuildingCode == building_code,
        Block.BlockCode == block_code,
        Floor.FloorCode == floor_code
    ).all()
    if not spaces: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Space not found")
    return spaces

def get_space(db, space_id):
    space = db.query(Space).filter(Space.SpaceID == space_id).first()
    if not space: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Space not found")
    return space

def get_facilites(db, campus_code):
    facility_rows = (
        db.query(
            Building.BuildingID, Building.BuildingCode, Building.BuildingName, Building.IsActive.label("BuildingIsActive"),
            Zone.ZoneCode, Zone.ZoneName,
            Block.BlockID, Block.BlockCode, Block.BlockName, Block.IsActive.label("BlockIsActive"),
            Floor.FloorID, Floor.FloorCode, Floor.FloorName, Floor.IsActive.label("FloorIsActive"),
            Space.SpaceID, Space.SpaceCode, Space.SpaceName, Space.SpaceType, Space.SpaceArea, Space.SpaceEPU, Space.IsActive.label("SpaceIsActive"),
        )
        .select_from(Building)
        .outerjoin(Zone, Zone.ZoneID == Building.ZoneID)
        .outerjoin(Block, Block.BuildingID == Building.BuildingID)
        .outerjoin(Floor, Floor.BlockID == Block.BlockID)
        .outerjoin(Space, Space.FloorID == Floor.FloorID)
        .filter(
            Building.CampusCode == campus_code,
            Building.ZoneID != None,
        )
        .order_by(Block.BlockCode, Floor.FloorCode, Space.SpaceCode)
        .all()
    )

    buildings_map = {}
    blocks_map = {}
    floors_map = {}
    spaces_seen = set()
    for facility in facility_rows:
        if facility.BuildingID not in buildings_map:
            buildings_map[facility.BuildingID] = FacilityTableResponse(
                id=facility.BuildingID,
                level='building',
                code=facility.BuildingCode,
                name=facility.BuildingName,
                isActive=facility.BuildingIsActive,
                zoneCode=facility.ZoneCode,
                zoneName=facility.ZoneName,
                subRows=[],
            )
        building_node = buildings_map[facility.BuildingID]

        if facility.BlockID is not None:
            if facility.BlockID not in blocks_map:
                block_node = FacilityTableResponse(
                    id=facility.BlockID,
                    level='block',
                    code=facility.BlockCode,
                    name=facility.BlockName,
                    isActive=facility.BlockIsActive,
                    subRows=[],
                )
                blocks_map[facility.BlockID] = block_node
                building_node.subRows.append(block_node)
            else:
                block_node = blocks_map[facility.BlockID]

            if facility.FloorID is not None:
                if facility.FloorID not in floors_map:
                    floor_node = FacilityTableResponse(
                        id=facility.FloorID,
                        level='floor',
                        code=facility.FloorCode,
                        name=facility.FloorName,
                        isActive=facility.FloorIsActive,
                        subRows=[],
                    )
                    floors_map[facility.FloorID] = floor_node
                    block_node.subRows.append(floor_node)
                else:
                    floor_node = floors_map[facility.FloorID]

                if facility.SpaceID is not None and facility.SpaceID not in spaces_seen:
                    spaces_seen.add(facility.SpaceID)
                    space_node = FacilityTableResponse(
                        id=facility.SpaceID,
                        level='space',
                        code=facility.SpaceCode,
                        name=facility.SpaceName,
                        isActive=facility.SpaceIsActive,
                        spaceType=facility.SpaceType,
                        spaceArea=facility.SpaceArea,
                        spaceEPU=facility.SpaceEPU,
                    )
                    floor_node.subRows.append(space_node)

    facility_data = list(buildings_map.values())
    return facility_data


# IsActive toggles
def set_zone_active(db, zone_id, is_active):
    zone = get_zone(db, zone_id)
    zone.IsActive = is_active
    db.commit()
    db.refresh(zone)
    return zone

def set_building_active(db, building_id, is_active):
    building = get_building(db, building_id)
    building.IsActive = is_active
    db.commit()
    db.refresh(building)
    return building

def set_block_active(db, block_id, is_active):
    block = get_block(db, block_id)
    block.IsActive = is_active
    db.commit()
    db.refresh(block)
    return block

def set_floor_active(db, floor_id, is_active):
    floor = get_floor(db, floor_id)
    floor.IsActive = is_active
    db.commit()
    db.refresh(floor)
    return floor

def set_space_active(db, space_id, is_active):
    space = get_space(db, space_id)
    space.IsActive = is_active
    db.commit()
    db.refresh(space)
    return space