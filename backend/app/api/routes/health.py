"""Health check router for service status verification."""

from typing import Dict
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    """Schema for health endpoint response."""

    status: str
    service: str


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service Health Check",
    description="Returns current status of the PAYGUARD AI backend service.",
)
async def get_health() -> Dict[str, str]:
    """Health check endpoint returning service status.

    Returns:
        dict: Status and service identifier.
    """
    return {
        "status": "ok",
        "service": "payguard-api",
    }
