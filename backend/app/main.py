"""PAYGUARD AI - Main FastAPI Application."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import health
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager for startup and shutdown events."""
    # Phase 1: Application initialization
    yield
    # Phase 1: Application shutdown cleanup


def create_application() -> FastAPI:
    """Factory function to build and configure the FastAPI application instance."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=(
            "PAYGUARD AI - Intent-Aware Real-Time Financial Scam Prevention "
            "and Payment Intervention System (Prototype - Phase 1)"
        ),
        lifespan=lifespan,
    )

    # Enable CORS for local frontend integration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Exception Handler
    @app.exception_handler(Exception)
    async def global_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "message": "An internal server error occurred.",
                "detail": str(exc) if settings.DEBUG else "Internal Server Error",
            },
        )

    # Mount health endpoint at root /health as requested in specifications
    app.include_router(health.router)

    # Also mount router under versioned API prefix for future expansion
    app.include_router(health.router, prefix=settings.API_V1_STR)

    return app


app = create_application()
