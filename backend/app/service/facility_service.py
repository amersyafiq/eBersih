from ..models import Campus, Zone, Building, Block, Floor, Space
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
    zones = db.query(Zone).filter(Zone.CampusCode == campus_code).all()
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