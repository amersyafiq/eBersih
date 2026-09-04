from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator
from typing import Optional, Annotated

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[int] = None

class RefreshRequest(BaseModel):
    refresh_token: str

# =================================================

class CompanyResponse(BaseModel):
    CompanyID: int
    CompanyName: str

    model_config = ConfigDict(from_attributes=True)

# ==================================================

class ZoneResponse(BaseModel):
    ZoneID: int
    ZoneCode: str
    ZoneName: str
    IsActive: bool
    CampusCode: str

    model_config = ConfigDict(from_attributes=True)


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
    company: Optional[CompanyResponse] = None
    zone: Optional[ZoneResponse] = None

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