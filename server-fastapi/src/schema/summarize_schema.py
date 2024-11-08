from pydantic import BaseModel, Field

class Message(BaseModel):
    personId: str = Field(description="Person ID")
    plainText: str = Field(description="Plain text")

class SummarizeInput(BaseModel):
    messages: list[Message] = Field(description="Messages to summarize")

class SummarizeOutput(BaseModel):
    output: str = Field(description="Summarized text")