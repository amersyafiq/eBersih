from __future__ import annotations
from datetime import datetime, time
from pydantic import BaseModel, ConfigDict, EmailStr, Field, StrictBool, model_validator
from typing import List, Literal, Optional, Annotated

from sqlalchemy import Boolean

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[int] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# =================================================

class CompanyOut(BaseModel):
    CompanyID: int
    CompanyName: str

    model_config = ConfigDict(from_attributes=True)

# ==================================================

class CampusBase(BaseModel):
    CampusCode: str
    CampusName: str
    State: str

class CampusCreate(CampusBase):
    pass

class CampusOut(CampusBase):
    class Config:
        from_attributes = True


class ZoneBase(BaseModel):
    ZoneCode: str
    ZoneName: str
    CampusCode: str

class ZoneCreate(ZoneBase):
    pass

class ZoneOut(ZoneBase):
    ZoneID: int
    IsActive: bool

    class Config:
        from_attributes = True


class BuildingBase(BaseModel):
    BuildingCode: str
    BuildingName: str
    CampusCode: str
    ZoneID: int | None = None

class BuildingCreate(BuildingBase):
    pass

class BuildingOut(BuildingBase):
    BuildingID: int
    IsActive: bool

    class Config:
        from_attributes = True


class BlockBase(BaseModel):
    BlockCode: str
    BlockName: str
    BuildingID: int

class BlockCreate(BlockBase):
    pass

class BlockOut(BlockBase):
    BlockID: int
    IsActive: bool

    class Config:
        from_attributes = True


class FloorBase(BaseModel):
    FloorCode: str
    FloorName: str
    BlockID: int

class FloorCreate(FloorBase):
    pass

class FloorOut(FloorBase):
    FloorID: int
    IsActive: bool

    class Config:
        from_attributes = True


class SpaceBase(BaseModel):
    SpaceCode: str
    SpaceName: str
    SpaceDescription: str | None = None
    SpaceType: str | None = None
    SpaceArea: float | None = None
    SpaceEPU: float | None = None
    FloorID: int
    TaskGroupID: int | None = None

class SpaceCreate(SpaceBase):
    pass

class SpaceOut(SpaceBase):
    SpaceID: int
    IsActive: bool
    QRCode: str | None = None

    class Config:
        from_attributes = True


# ==================================================

class CreateUser(BaseModel):
    Fullname: str
    Email: EmailStr
    Password: str
    PhoneNo: str
    Role: str
    Category: str | None = None
    CompanyID: int | None = None
    ZoneID: int | None = None

class UserOut(BaseModel):
    UserID: int
    Fullname: str
    Email: EmailStr
    PhoneNo: str
    Role: str
    Category: str | None = None
    IsActive: bool
    CreatedAt: datetime
    UpdatedAt: datetime | None = None
    company: Optional[CompanyOut] = None
    zone: Optional[ZoneOut] = None
    campus: Optional[CampusOut] = None

    model_config = ConfigDict(from_attributes=True)


# ==================================================

class TaskBase(BaseModel):
    TaskName: str
    TaskType: str
    RequiredCategory: str
    DurationBasis: str
    DurationValue: float

class TaskCreate(TaskBase):
    pass

class TaskOut(TaskBase):
    TaskID: int
    IsActive: bool

    model_config = ConfigDict(from_attributes=True)


class TaskGroupBase(BaseModel):
    TaskGroupName: str
    Description: str | None = None

class TaskGroupCreate(TaskGroupBase):
    pass

class TaskGroupOut(TaskGroupBase):
    TaskGroupID: int
    IsActive: bool

    model_config = ConfigDict(from_attributes=True)


class TaskGroupTaskCreate(BaseModel):
    TaskGroupID: int
    TaskID: int
    FrequencyType: str
    FrequencyValue: int | None = None
    Slot: str | None = None

class TaskGroupTaskOut(TaskGroupTaskCreate):
    model_config = ConfigDict(from_attributes=True)


class ReportSummary(BaseModel):
    total_contractors: int
    active_contractors: int
    total_cleaners: int
    active_cleaners: int
    total_tasks: int
    active_tasks: int
    total_task_groups: int
    active_task_groups: int

# ==================================================

class AssignmentBase(BaseModel):
    AssignID: int
    Status: str
    RoomID: int
    TaskID: int
    ScheduleID: int
    CleanerID: int

class AssigmentCreate(AssignmentBase):
    pass

class AssignmentOut(AssignmentBase):
    StartTime: time
    EndTime: time
    CleanRating: int
    SupervisorID: int

    model_config = ConfigDict(from_attributes=True)


class ScheduleBase(BaseModel):
    TriggeredAt: datetime
    FitnessValue: float
    Generations: int
    TotalTasks: int
    TotalCleaners: int
    ZoneID: int

class ScheduleCreate(BaseModel):
    pass

class ScheduleOut(BaseModel):
    ScheduleID: int
    CompletedAt: datetime
    assignment: List[AssignmentOut]

    model_config = ConfigDict(from_attributes=True)

# =====================LIVE=========================

class BuildingStatus(BaseModel):
    CampusCode: str
    ZoneCode: str
    ZoneName: str
    BuildingCode: str
    BuildingName: str
    TotalAssignments: int
    TotalCompletedAssignments: int
    TotalCleaners: int

class FacilityNode(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    type: Literal["block", "floor", "space", "task"]
    status: Optional[str] = None
    cleanerName: Optional[str] = None
    subRows: Optional[List[FacilityNode]] = None

    class Config:
        from_attributes = True

class CleanerNode(BaseModel):
    id: int
    type: Literal["cleaner", "assignment"]
    cleanerName: Optional[str] = None
    category: Optional[str] = None
    company: Optional[str] = None
    taskName: Optional[str] = None
    spaceCode: Optional[str] = None
    spaceName: Optional[str] = None
    status: Optional[str] = None
    subRows: Optional[List[CleanerNode]] = None

    class Config:
        from_attributes = True

class BuildingDetailsResponse(BaseModel):
    buildingCode: str
    buildingName: str
    scheduleDate: str
    facilityData: List[FacilityNode]
    cleanerData: List[CleanerNode]

FacilityNode.model_rebuild()
CleanerNode.model_rebuild()

# =====================FACILITY=========================
class FacilityTableResponse(BaseModel):
    id: int
    level: Literal["building", "block", "floor", "space"]
    code: str
    name: str
    isActive: StrictBool
    zoneCode: Optional[str] = None
    zoneName: Optional[str] = None
    spaceType: Optional[str] = None
    spaceArea: Optional[float] = None
    spaceEpu: Optional[float] = None
    subRows: Optional[List[FacilityTableResponse]] = None

    class Config:
        from_attributes = True

FacilityTableResponse.model_rebuild()

# =====================CONTRACTOR=========================
class ContractorTableResponse(BaseModel):
    companyID: int
    companyRegNo: str
    companyName: str
    companyPhone: str
    assignedZones: Optional[List[str]] = None
    totalCleaners: Optional[int] = None

class ContractorCreate(BaseModel):
    companyRegNo: str
    companyName: str
    companyPhone: str
    selectedZones: List[str]