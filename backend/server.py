from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import json
import logging
import re
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone

import pdfplumber
import docx
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

# -------------------- ENV --------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

# -------------------- APP --------------------
app = FastAPI(title="UttamCV")

# ✅ CORS (FIXED)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# -------------------- MODELS --------------------
class AnalysisResult(BaseModel):
    id: str
    match_score: int
    summary: str
    matched_skills: List[str]
    missing_skills: List[str]
    suggestions: List[str]
    strengths: List[str]
    resume_filename: Optional[str] = None
    created_at: str

# -------------------- FILE PARSING --------------------
def extract_text_from_pdf(data: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            text_parts.append(page.extract_text() or "")
    return "\n".join(text_parts).strip()

def extract_text_from_docx(data: bytes) -> str:
    document = docx.Document(io.BytesIO(data))
    return "\n".join(p.text for p in document.paragraphs).strip()

def extract_text_from_file(filename: str, data: bytes) -> str:
    filename = filename.lower()
    if filename.endswith(".pdf"):
        return extract_text_from_pdf(data)
    elif filename.endswith(".docx"):
        return extract_text_from_docx(data)
    elif filename.endswith(".txt"):
        return data.decode("utf-8", errors="ignore")
    raise HTTPException(status_code=400, detail="Unsupported file format")

# -------------------- ROOT --------------------
@api_router.get("/")
async def root():
    return {"service": "HireSense AI", "status": "ok"}

# -------------------- ANALYZE --------------------
@api_router.post("/analyze", response_model=AnalysisResult)
async def analyze(
    job_description: str = Form(...),
    resume_text: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
):
    if len(job_description.strip()) < 20:
        raise HTTPException(status_code=400, detail="Job description too short")

    if resume_file:
        data = await resume_file.read()
        text = extract_text_from_file(resume_file.filename, data)
        filename = resume_file.filename
    elif resume_text:
        text = resume_text
        filename = None
    else:
        raise HTTPException(status_code=400, detail="No resume provided")

    # 🔥 TEMP MOCK (so it doesn't crash without LLM)
    analysis = {
        "match_score": 75,
        "summary": "Good match for the role.",
        "matched_skills": ["Python", "DSA"],
        "missing_skills": ["System Design"],
        "suggestions": ["Add projects", "Improve formatting"],
        "strengths": ["Strong fundamentals"],
    }

    doc_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    return AnalysisResult(
        id=doc_id,
        resume_filename=filename,
        created_at=created_at,
        **analysis,
    )

# -------------------- ROUTER --------------------
app.include_router(api_router)

# -------------------- LOGGING --------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()