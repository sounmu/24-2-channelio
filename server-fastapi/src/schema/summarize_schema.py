from pydantic import BaseModel, Field

class Message(BaseModel):
    personId: str = Field(description="Person ID")
    plainText: str = Field(description="Plain text")

class Alarm(BaseModel):
    todo: str = Field(description="Todo")
    reserved_time: str = Field(description="Reserved time")

class SummarizeInput(BaseModel):
    user_id: str = Field(description="User ID")
    data: list[Message] = Field(description="Messages to summarize")
    count: int = Field(description="Count of messages")

class SummarizeOutput(BaseModel):
    output: str = Field(description="Summarized text")
    alarm: list[Alarm] = Field(description="Alarmized text")
