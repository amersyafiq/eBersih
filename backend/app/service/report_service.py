from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import Task, TaskGroup, User


def get_summary(db: Session):
    def count(model, *filters):
        query = db.query(func.count()).select_from(model)
        return query.filter(*filters).scalar() or 0

    return {
        "total_contractors": count(User, User.Role == "Contractor"),
        "active_contractors": count(User, User.Role == "Contractor", User.IsActive.is_(True)),
        "total_cleaners": count(User, User.Role == "Cleaner"),
        "active_cleaners": count(User, User.Role == "Cleaner", User.IsActive.is_(True)),
        "total_tasks": count(Task),
        "active_tasks": count(Task, Task.IsActive.is_(True)),
        "total_task_groups": count(TaskGroup),
        "active_task_groups": count(TaskGroup, TaskGroup.IsActive.is_(True)),
    }