from sqlalchemy import (
    Column,
    Float,
    Integer,
    String,
    Boolean,
    Date,
    DateTime,
    Time,
    Numeric,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    Index,
    func,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mssql import DATETIME2

from .config.database import Base


class Campus(Base):
    __tablename__ = "Campus"

    CampusCode = Column(String(3), primary_key=True)
    CampusName = Column(String(255), nullable=False)
    State = Column(String(5), nullable=False)

    zones = relationship("Zone", back_populates="campus")
    buildings = relationship("Building", back_populates="campus")


class Zone(Base):
    __tablename__ = "Zone"

    ZoneID = Column(Integer, primary_key=True, autoincrement=True)
    ZoneCode = Column(String(30), nullable=False, unique=True)
    ZoneName = Column(String(255), nullable=False)
    IsActive = Column(Boolean, nullable=False, server_default="1")
    CampusCode = Column(String(3), ForeignKey("Campus.CampusCode"), nullable=False)

    campus = relationship("Campus", back_populates="zones")
    buildings = relationship("Building", back_populates="zone")
    company_zones = relationship("CompanyZone", back_populates="zone")
    users = relationship("User", back_populates="zone")
    ga_schedules = relationship("GASchedule", back_populates="zone")


class Building(Base):
    __tablename__ = "Building"

    BuildingID = Column(Integer, primary_key=True, autoincrement=True)
    BuildingCode = Column(String(5), nullable=False, unique=True)
    BuildingName = Column(String(255), nullable=False)
    IsActive = Column(Boolean, nullable=False, server_default="1")
    ZoneID = Column(Integer, ForeignKey("Zone.ZoneID"), nullable=True)
    CampusCode = Column(String(3), ForeignKey("Campus.CampusCode"), nullable=False)

    zone = relationship("Zone", back_populates="buildings")
    campus = relationship("Campus", back_populates="buildings")
    blocks = relationship("Block", back_populates="building")


class Block(Base):
    __tablename__ = "Block"

    BlockID = Column(Integer, primary_key=True, autoincrement=True)
    BlockCode = Column(String(10), nullable=False, unique=True)
    BlockName = Column(String(255), nullable=False)
    IsActive = Column(Boolean, nullable=False, server_default="1")
    BuildingID = Column(Integer, ForeignKey("Building.BuildingID"), nullable=False)

    building = relationship("Building", back_populates="blocks")
    floors = relationship("Floor", back_populates="block")


class Floor(Base):
    __tablename__ = "Floor"

    FloorID = Column(Integer, primary_key=True, autoincrement=True)
    FloorCode = Column(String(15), nullable=False, unique=False)
    FloorName = Column(String(100), nullable=False)
    IsActive = Column(Boolean, nullable=False, server_default="1")
    BlockID = Column(Integer, ForeignKey("Block.BlockID"), nullable=False)

    block = relationship("Block", back_populates="floors")
    spaces = relationship("Space", back_populates="floor")


class Space(Base):
    __tablename__ = "Space"

    SpaceID = Column(Integer, primary_key=True, autoincrement=True)
    SpaceCode = Column(String(20), nullable=False, unique=True)
    SpaceName = Column(String(255), nullable=False)
    SpaceDescription = Column(String(255), nullable=True)
    SpaceType = Column(String(50), nullable=True)
    SpaceArea = Column(Float, nullable=True)
    SpaceEPU = Column(Float, nullable=True)
    IsActive = Column(Boolean, nullable=False, server_default="1")
    QRCode = Column(String(500), nullable=True)
    FloorID = Column(Integer, ForeignKey("Floor.FloorID"), nullable=False)
    TaskGroupID = Column(Integer, ForeignKey("TaskGroup.TaskGroupID"), nullable=True)

    floor = relationship("Floor", back_populates="spaces")
    task_group = relationship("TaskGroup", back_populates="spaces")
    assignments = relationship("Assignment", back_populates="space")
    work_orders = relationship("WorkOrder", back_populates="space")


# Tasks

class Task(Base):
    __tablename__ = "Task"

    TaskID = Column(Integer, primary_key=True, autoincrement=True)
    TaskName = Column(String(150), nullable=False)
    TaskType = Column(String(30), nullable=False)  # e.g. General / Washroom / Specialized
    RequiredCategory = Column(String(30), nullable=False)  # e.g. Pekerja Am / Operator Mesin
    DurationBasis = Column(String(10), nullable=False)  # e.g. Area / Fixed
    DurationValue = Column(Float, nullable=False)
    IsActive = Column(Boolean, nullable=False, server_default="1")

    task_group_tasks = relationship("TaskGroupTask", back_populates="task")
    assignments = relationship("Assignment", back_populates="task")


class TaskGroup(Base):
    __tablename__ = "TaskGroup"

    TaskGroupID = Column(Integer, primary_key=True, autoincrement=True)
    TaskGroupName = Column(String(100), nullable=False)
    Description = Column(String(255), nullable=True)
    IsActive = Column(Boolean, nullable=False, server_default="1")

    spaces = relationship("Space", back_populates="task_group")
    task_group_tasks = relationship("TaskGroupTask", back_populates="task_group")


class TaskGroupTask(Base):
    __tablename__ = "TaskGroupTask"

    TaskGroupID = Column(Integer, ForeignKey("TaskGroup.TaskGroupID"), primary_key=True)
    TaskID = Column(Integer, ForeignKey("Task.TaskID"), primary_key=True)

    FrequencyType = Column(String(20), nullable=False)  # e.g. Daily / Weekly / BiWeekly / Monthly / On Demand
    FrequencyValue = Column(Integer, nullable=True)
    Slot = Column(String(20), nullable=True)  # e.g. Morning / Afternoon / Evening / Night
    IsActive = Column(Boolean, nullable=False, server_default="1")

    task_group = relationship("TaskGroup", back_populates="task_group_tasks")
    task = relationship("Task", back_populates="task_group_tasks")


# Company / Contractor

class Company(Base):
    __tablename__ = "Company"

    CompanyID = Column(Integer, primary_key=True, autoincrement=True)
    CompanyName = Column(String(150), nullable=False)
    CompanyRegNo = Column(String(50), nullable=False)
    CompanyPhone = Column(String(50), nullable=False)

    company_zones = relationship("CompanyZone", back_populates="company")
    users = relationship("User", back_populates="company")


class CompanyZone(Base):
    __tablename__ = "CompanyZone"

    CompanyID = Column(Integer, ForeignKey("Company.CompanyID"), primary_key=True)
    ZoneID = Column(Integer, ForeignKey("Zone.ZoneID"), primary_key=True)
    IsActive = Column(Boolean, nullable=False, server_default="1")

    company = relationship("Company", back_populates="company_zones")
    zone = relationship("Zone", back_populates="company_zones")


# Users

class User(Base):
    __tablename__ = "User"

    UserID = Column(Integer, primary_key=True, autoincrement=True)
    Fullname = Column(String(150), nullable=False)
    Email = Column(String(150), nullable=False, unique=True)
    Password = Column(String(255), nullable=False)
    PhoneNo = Column(String(20), nullable=True)
    Role = Column(String(20), nullable=False) # e.g. Cleaner / Contractor / Facility Admin 
    Category = Column(String(30), nullable=True) # e.g. Pekerja Am / Operator Mesin / Penyelia
    IsActive = Column(Boolean, nullable=False, server_default="1")
    CreatedAt = Column(DATETIME2, nullable=False, server_default=func.now())
    UpdatedAt = Column(DATETIME2, nullable=True, onupdate=func.now())
    CompanyID = Column(Integer, ForeignKey("Company.CompanyID"), nullable=True)
    ZoneID = Column(Integer, ForeignKey("Zone.ZoneID"), nullable=True)

    company = relationship( "Company", back_populates="users" )
    zone = relationship( "Zone", back_populates="users" )
    attendances = relationship("Attendance", back_populates="user")
    cleaner_assignments = relationship( "Assignment", back_populates="cleaner", foreign_keys="Assignment.CleanerID" )
    supervisor_assignments = relationship( "Assignment", back_populates="supervisor", foreign_keys="Assignment.SupervisorID" )
    leave_requests = relationship("LeaveRequest", back_populates="user", foreign_keys="LeaveRequest.UserID")


class Attendance(Base):
    __tablename__ = "Attendance"

    AttendanceID = Column(Integer, primary_key=True, autoincrement=True)
    AttendanceDate = Column(Date, nullable=False)
    ClockInTime = Column(DATETIME2, nullable=True)
    ClockOutTime = Column(DATETIME2, nullable=True)
    UserID = Column(Integer, ForeignKey("User.UserID"), nullable=False)

    user = relationship("User", back_populates="attendances")
    

class LeaveRequest(Base):
    __tablename__ = "LeaveRequest"

    LeaveID = Column(Integer, primary_key=True, autoincrement=True)
    StartDate = Column(Date, nullable=False)
    EndDate = Column(Date, nullable=False)  # same as StartDate for a single-day request
    LeaveType = Column(String(30), nullable=True)  # e.g. "Annual", "Medical", "Emergency"
    Reason = Column(String(255), nullable=True)
    Status = Column(String(20), nullable=False, server_default="Pending")  # "Pending" / "Approved" / "Rejected"
    CreatedAt = Column(DATETIME2, nullable=False, server_default=func.now())
    UpdatedAt = Column(DATETIME2, nullable=True, onupdate=func.now())
    UserID = Column(Integer, ForeignKey("User.UserID"), nullable=False)
    ApprovedBy = Column(Integer, ForeignKey("User.UserID"), nullable=True)  # the contractor/supervisor who actioned it

    user = relationship("User", back_populates="leave_requests", foreign_keys=[UserID])
    approver = relationship("User", foreign_keys=[ApprovedBy])

# GA Scheduling & Assignments

class GASchedule(Base):
    __tablename__ = "GASchedule"

    ScheduleID = Column(Integer, primary_key=True, autoincrement=True)
    ScheduleDate = Column(Date, nullable=False, server_default=func.now())
    TriggeredAt = Column(DATETIME2, nullable=True)
    CompletedAt = Column(DATETIME2, nullable=True)
    FitnessValue = Column(Numeric(18, 6), nullable=True)
    Generations = Column(Integer, nullable=True)
    TotalTasks = Column(Integer, nullable=True)
    TotalCleaners = Column(Integer, nullable=True)
    ZoneID = Column(Integer, ForeignKey("Zone.ZoneID"), nullable=False)

    zone = relationship("Zone", back_populates="ga_schedules")
    assignments = relationship("Assignment", back_populates="schedule")


class WorkOrder(Base):
    __tablename__ = "WorkOrder"
    __table_args__ = (
        Index("IX_WorkOrder_Space", "SpaceID"),
    )

    WorkOrderID = Column(Integer, primary_key=True, autoincrement=True)
    WrID = Column(String(50), nullable=False, unique=True)  # eAduan's WR ID (for reference)
    Requestor = Column(String(255), nullable=False)
    ProblemDesc = Column(String(500), nullable=True)
    Priority = Column(String(20), nullable=False, server_default="Normal")  # Low / Normal / High / Urgent
    Status = Column(String(20), nullable=False, server_default="New")      # New / Assigned / InProgress / Completed / Cancelled
    IssuedAt = Column(DATETIME2, nullable=False, server_default=func.now())  # when eAduan sent it
    SpaceID = Column(Integer, ForeignKey("Space.SpaceID"), nullable=False)

    space = relationship("Space", back_populates="work_orders")
    assignment = relationship("Assignment", back_populates="work_order", uselist=False)


class Assignment(Base):
    __tablename__ = "Assignment"
    __table_args__ = (
        CheckConstraint(
            "CleanRating BETWEEN 1 AND 3 OR CleanRating IS NULL",
            name="CK_CleanRating",
        ),
        Index("IX_Assignment_Space_Task", "SpaceID", "TaskID"),
    )

    AssignID = Column(Integer, primary_key=True, autoincrement=True)
    Status = Column(String(20), nullable=False)
    StartTime = Column(Time, nullable=True)
    EndTime = Column(Time, nullable=True)
    CleanRating = Column(Integer, nullable=True)
    EstimatedDuration = Column(Integer, nullable=True)

    SpaceID = Column(Integer, ForeignKey("Space.SpaceID"), nullable=False)
    TaskID = Column(Integer, ForeignKey("Task.TaskID"), nullable=True)
    ScheduleID = Column(Integer, ForeignKey("GASchedule.ScheduleID"), nullable=True)
    CleanerID = Column(Integer, ForeignKey("User.UserID"), nullable=False)
    SupervisorID = Column(Integer, ForeignKey("User.UserID"), nullable=True)
    WorkOrderID = Column(Integer, ForeignKey("WorkOrder.WorkOrderID"), nullable=True, unique=True)

    space = relationship("Space", back_populates="assignments")
    task = relationship("Task", back_populates="assignments")
    schedule = relationship("GASchedule", back_populates="assignments")
    cleaner = relationship("User", back_populates="cleaner_assignments", foreign_keys=[CleanerID])
    supervisor = relationship("User", back_populates="supervisor_assignments", foreign_keys=[SupervisorID])
    work_order = relationship("WorkOrder", back_populates="assignment")