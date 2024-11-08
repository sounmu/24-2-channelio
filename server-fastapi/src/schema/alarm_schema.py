from pydantic import BaseModel
from datetime import datetime

class AlarmCreate(BaseModel):
    user_id: int
    message: str
    reserved_time: datetime

class AlarmRead(BaseModel):
    id: int
    user_id: int
    message: str
    reserved_time: datetime
    is_active: bool
    created_at: datetime
