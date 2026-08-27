"""Rename Room to Space and removed TaskGroupTask surrogate key

Revision ID: 9013ba5ba29c
Revises: b4cddb47d54f
Create Date: 2026-08-22 16:53:07.593803

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mssql

# revision identifiers, used by Alembic.
revision: str = '9013ba5ba29c'
down_revision: Union[str, Sequence[str], None] = 'b4cddb47d54f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Room -> Space: rename table, then rename each affected column ---
    op.rename_table('Room', 'Space')

    op.alter_column('Space', 'RoomID', new_column_name='SpaceID', existing_type=sa.Integer())
    op.alter_column('Space', 'RoomCode', new_column_name='SpaceCode', existing_type=sa.String(length=20))
    op.alter_column('Space', 'RoomName', new_column_name='SpaceName', existing_type=sa.String(length=255))
    op.alter_column('Space', 'RoomDescription', new_column_name='SpaceDescription', existing_type=sa.String(length=255))
    op.alter_column('Space', 'RoomType', new_column_name='SpaceType', existing_type=sa.String(length=50))
    op.alter_column('Space', 'RoomArea', new_column_name='SpaceArea', existing_type=sa.Float())
    op.alter_column('Space', 'RoomEPU', new_column_name='SpaceEPU', existing_type=sa.Float())
    # IsActive, QRCode, FloorID, TaskGroupID keep their names — no change needed.
    # The primary key constraint, the FloorID/TaskGroupID foreign keys, and the
    # SpaceCode unique constraint all stay attached automatically — SQL Server
    # ties constraints to internal column/object IDs, not names, so renaming
    # doesn't require dropping and recreating them.

    # --- Assignment.RoomID -> Assignment.SpaceID: rename column in place ---
    op.alter_column('Assignment', 'RoomID', new_column_name='SpaceID', existing_type=sa.Integer())
    # Same reasoning: the existing FK constraint to Space (formerly Room)
    # remains valid without being dropped/recreated.

    op.drop_index(op.f('IX_Assignment_Room_Task'), table_name='Assignment')
    op.create_index('IX_Assignment_Space_Task', 'Assignment', ['SpaceID', 'TaskID'], unique=False)

    # --- TaskGroupTask: drop surrogate key, promote to composite PK ---
    op.drop_constraint(op.f('PK__TaskGrou__AC3CCE7FC0522E69'), 'TaskGroupTask', type_='primary')
    op.drop_column('TaskGroupTask', 'TaskGroupTaskID')
    op.create_primary_key(
        'PK_TaskGroupTask', 'TaskGroupTask', ['TaskGroupID', 'TaskID']
    )
    # The old UQ_TaskGroupTask_Group_Task unique constraint is now redundant
    # (the composite PK enforces the same thing) — drop it if it still exists.
    op.drop_constraint('UQ_TaskGroupTask_Group_Task', 'TaskGroupTask', type_='unique')


def downgrade() -> None:
    # --- TaskGroupTask: restore surrogate key ---
    op.drop_constraint('PK_TaskGroupTask', 'TaskGroupTask', type_='primary')
    op.add_column(
        'TaskGroupTask',
        sa.Column('TaskGroupTaskID', sa.Integer(), sa.Identity(always=False, start=1, increment=1), autoincrement=True, nullable=False),
    )
    op.create_primary_key('PK__TaskGrou__AC3CCE7FC0522E69', 'TaskGroupTask', ['TaskGroupTaskID'])
    op.create_unique_constraint('UQ_TaskGroupTask_Group_Task', 'TaskGroupTask', ['TaskGroupID', 'TaskID'])

    # --- Assignment.SpaceID -> Assignment.RoomID ---
    op.drop_index('IX_Assignment_Space_Task', table_name='Assignment')
    op.create_index(op.f('IX_Assignment_Room_Task'), 'Assignment', ['RoomID', 'TaskID'], unique=False)
    op.alter_column('Assignment', 'SpaceID', new_column_name='RoomID', existing_type=sa.Integer())

    # --- Space -> Room: rename columns back, then rename table ---
    op.alter_column('Space', 'SpaceID', new_column_name='RoomID', existing_type=sa.Integer())
    op.alter_column('Space', 'SpaceCode', new_column_name='RoomCode', existing_type=sa.String(length=20))
    op.alter_column('Space', 'SpaceName', new_column_name='RoomName', existing_type=sa.String(length=255))
    op.alter_column('Space', 'SpaceDescription', new_column_name='RoomDescription', existing_type=sa.String(length=255))
    op.alter_column('Space', 'SpaceType', new_column_name='RoomType', existing_type=sa.String(length=50))
    op.alter_column('Space', 'SpaceArea', new_column_name='RoomArea', existing_type=sa.Float())
    op.alter_column('Space', 'SpaceEPU', new_column_name='RoomEPU', existing_type=sa.Float())

    op.rename_table('Space', 'Room')
