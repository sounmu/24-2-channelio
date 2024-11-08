from fastapi import APIRouter, status
from config import Settings
from schema.summarize_schema import SummarizeInput, SummarizeOutput
from service.summarize_service import service_summarize

settings = Settings()

router = APIRouter(
    prefix="/api",
    tags=["summarize"],
)

@router.post(
    "/summarize", 
    response_model=SummarizeOutput,
    status_code=status.HTTP_200_OK
)
async def summarize(
    request: SummarizeInput
):
    result = await service_summarize(request)
    return result