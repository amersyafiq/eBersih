from sqlalchemy import (
    Column,
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
    func,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mssql import DATETIME2

from app.database import Base


class Campus(Base):
    __tablename__ = "Campus"

    CampusCode = Column(String(3), primary_key=True)
    CampusName = Column(String(3), nullable=False)
    State = Column(String(5), nullable=False)

    zones = relationship("Zone", back_populates="campus")


class Zone(Base):
    __tablename__ = "Zone"

    ZoneID = Column(Integer, primary_key=True, autoincrement=True)
    ZoneCode = Column(String(30), nullable=False, unique=True)
    ZoneName = Column(String(255), nullable=False)
    IsActive = Column(Boolean, nullable=False, default=True)
    CampusCode = Column(String(3), ForeignKey("Campus.CampusCode"), nullable=False)

    campus = relationship("Campus", back_populates="zones")
    buildings = relationship("Building", back_populates="zone")
    company_zones = relationship("CompanyZone", back_populates="zone")
    staff = relationship("Staff", back_populates="zone")
    ga_schedules = relationship("GASchedule", back_populates="zone")


class Building(Base):
    __tablename__ = "Building"

    BuildingID = Column(Integer, primary_key=True, autoincrement=True)
    BuildingCode = Column(String(5), nullable=False, unique=True)
    BuildingName = Column(String(255), nullable=False)
    IsActive = Column(Boolean, nullable=False, default=True)
    ZoneID = Column(Integer, ForeignKey("Zone.ZoneID"), nullable=False)

    zone = relationship("Zone", back_populates="buildings")
    blocks = relationship("Block", back_populates="building")


class Block(Base):
    __tablename__ = "Block"

    BlockID = Column(Integer, primary_key=True, autoincrement=True)
    BlockCode = Column(String(10), nullable=False, unique=True)
    BlockName = Column(String(255), nullable=False)
    IsActive = Column(Boolean, nullable=False, default=True)
    BuildingID = Column(Integer, ForeignKey("Building.BuildingID"), nullable=False)

    building = relationship("Building", back_populates="blocks")
    floors = relationship("Floor", back_populates="block")


class Floor(Base):
    __tablename__ = "Floor"

    FloorID = Column(Integer, primary_key=True, autoincrement=True)
    FloorCode = Column(String(15), nullable=False, unique=True)
    FloorName = Column(String(100), nullable=False)
    IsActive = Column(Boolean, nullable=False, default=True)
    BlockID = Column(Integer, ForeignKey("Block.BlockID"), nullable=False)

    block = relationship("Block", back_populates="floors")
    rooms = relationship("Room", back_populates="floor")


class Room(Base):
    __tablename__ = "Room"

    RoomID = Column(Integer, primary_key=True, autoincrement=True)
    RoomCode = Column(String(20), nullable=False, unique=True)
    RoomName = Column(String(255), nullable=False)
    RoomType = Column(String(50), nullable=False)
    QRCode = Column(String(500), nullable=True)
    FloorID = Column(Integer, ForeignKey("Floor.FloorID"), nullable=False)

    floor = relationship("Floor", back_populates="rooms")
    room_tasks = relationship("RoomTask", back_populates="room")


# Tasks

class Task(Base):
    __tablename__ = "Task"

    TaskID = Column(Integer, primary_key=True, autoincrement=True)
    TaskName = Column(String(150), nullable=False)
    RequiredCategory = Column(String(30), nullable=False)  # e.g. Pekerja Am / Operator Mesin
    DefaultDuration = Column(Integer, nullable=False)  # minutes
    FrequencyType = Column(String(20), nullable=False)
    IsActive = Column(Boolean, nullable=False, default=True)

    room_tasks = relationship("RoomTask", back_populates="task")


class RoomTask(Base):
    __tablename__ = "RoomTask"

    RoomTaskID = Column(Integer, primary_key=True, autoincrement=True)
    Slot = Column(String(20), nullable=True)
    RoomID = Column(Integer, ForeignKey("Room.RoomID"), nullable=False)
    TaskID = Column(Integer, ForeignKey("Task.TaskID"), nullable=False)

    room = relationship("Room", back_populates="room_tasks")
    task = relationship("Task", back_populates="room_tasks")
    assignments = relationship("Assignment", back_populates="room_task")


# Company / Contractor

class Company(Base):
    __tablename__ = "Company"

    CompanyID = Column(Integer, primary_key=True, autoincrement=True)
    CompanyName = Column(String(150), nullable=False)
    CompanyRegNo = Column(String(50), nullable=False)
    CompanyPhone = Column(String(50), nullable=False)

    company_zones = relationship("CompanyZone", back_populates="company")
    staff = relationship("Staff", back_populates="company")


class CompanyZone(Base):
    __tablename__ = "CompanyZone"

    CompanyID = Column(Integer, ForeignKey("Company.CompanyID"), primary_key=True)
    ZoneID = Column(Integer, ForeignKey("Zone.ZoneID"), primary_key=True)
    IsActive = Column(Boolean, nullable=False, default=True)

    company = relationship("Company", back_populates="company_zones")
    zone = relationship("Zone", back_populates="company_zones")


# Users / Staff

class User(Base):
    __tablename__ = "User"

    UserID = Column(Integer, primary_key=True, autoincrement=True)
    Fullname = Column(String(150), nullable=False)
    Email = Column(String(150), nullable=False, unique=True)
    Password = Column(String(255), nullable=False)
    PhoneNo = Column(String(20), nullable=True)
    IsActive = Column(Boolean, nullable=False, default=True)
    CreatedAt = Column(DATETIME2, nullable=False, server_default=func.now())
    UpdatedAt = Column(DATETIME2, nullable=True, onupdate=func.now())

    staff = relationship("Staff", back_populates="user", uselist=False)
    attendances = relationship("Attendance", back_populates="user")


class Staff(Base):
    __tablename__ = "Staff"

    UserID = Column(Integer, ForeignKey("User.UserID"), primary_key=True)
    Role = Column(String(20), nullable=False)  # Cleaner / Contractor / Facility Admin
    Category = Column(String(30), nullable=False)  # Pekerja Am / Operator Mesin / Penyelia
    CompanyID = Column(Integer, ForeignKey("Company.CompanyID"), nullable=False)
    ZoneID = Column(Integer, ForeignKey("Zone.ZoneID"), nullable=False)

    user = relationship("User", back_populates="staff")
    company = relationship("Company", back_populates="staff")
    zone = relationship("Zone", back_populates="staff")

    cleaner_assignments = relationship(
        "Assignment",
        back_populates="cleaner",
        foreign_keys="Assignment.CleanerID",
    )
    supervisor_assignments = relationship(
        "Assignment",
        back_populates="supervisor",
        foreign_keys="Assignment.SupervisorID",
    )


class Attendance(Base):
    __tablename__ = "Attendance"

    AttendanceID = Column(Integer, primary_key=True, autoincrement=True)
    AttendanceDate = Column(Date, nullable=False)
    ClockInTime = Column(DATETIME2, nullable=True)
    ClockOutTime = Column(DATETIME2, nullable=True)
    UserID = Column(Integer, ForeignKey("User.UserID"), nullable=False)

    user = relationship("User", back_populates="attendances")


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


class Assignment(Base):
    __tablename__ = "Assignment"
    __table_args__ = (
        CheckConstraint(
            "CleanRating BETWEEN 1 AND 3 OR CleanRating IS NULL",
            name="CK_CleanRating",
        ),
    )

    AssignID = Column(Integer, primary_key=True, autoincrement=True)
    Status = Column(String(20), nullable=False)
    StartTime = Column(Time, nullable=True)
    EndTime = Column(Time, nullable=True)
    CleanRating = Column(Integer, nullable=True)
    RoomTaskID = Column(Integer, ForeignKey("RoomTask.RoomTaskID"), nullable=False)
    ScheduleID = Column(Integer, ForeignKey("GASchedule.ScheduleID"), nullable=False)
    CleanerID = Column(Integer, ForeignKey("Staff.UserID"), nullable=False)
    SupervisorID = Column(Integer, ForeignKey("Staff.UserID"), nullable=True)

    room_task = relationship("RoomTask", back_populates="assignments")
    schedule = relationship("GASchedule", back_populates="assignments")
    cleaner = relationship( "Staff", back_populates="cleaner_assignments", foreign_keys=[CleanerID], )
    supervisor = relationship( "Staff", back_populates="supervisor_assignments", foreign_keys=[SupervisorID], )