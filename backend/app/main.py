import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cybertrace")

app = FastAPI(
    title="CyberTrace AI",
    description="Predictive Cybercrime & Cash Withdrawal Intelligence Platform (Synthetic-Data Demo)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Never leak raw stack traces to the client.
    logger.exception("Unhandled error on %s", request.url)
    return JSONResponse(status_code=500, content={"detail": "Internal server error. Please try again."})


app.include_router(router)


@app.get("/")
def root():
    return {
        "service": "CyberTrace AI backend",
        "status": "ONLINE",
        "docs": "/docs",
        "note": "Decision-support prototype using synthetic data only.",
    }
