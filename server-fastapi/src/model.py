from sqlalchemy import Column, Integer, Text, TIMESTAMP, Boolean
from database import Base

class Alarm(Base):
    __tablename__ = "alarms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=False)
    message = Column(Text, nullable=False)
    reserved_time = Column(TIMESTAMP, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")