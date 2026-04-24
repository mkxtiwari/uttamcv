from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from openai import OpenAI
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
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ['DB_NAME']]

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

app = FastAPI(title="UttamCV")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")


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


def extract_text_from_pdf(data: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text_parts.append(page_text)
    return "\n".join(text_parts).strip()


def extract_text_from_docx(data: bytes) -> str:
    f = io.BytesIO(data)
    document = docx.Document(f)
    return "\n".join(p.text for p in document.paragraphs).strip()


def extract_text_from_file(filename: str, data: bytes) -> str:
    lower = filename.lower()
    if lower.endswith('.pdf'):
        return extract_text_from_pdf(data)
    if lower.endswith('.docx'):
        return extract_text_from_docx(data)
    if lower.endswith('.txt'):
        return data.decode('utf-8', errors='ignore').strip()
    raise HTTPException(status_code=400, detail="Unsupported file format.")


def _parse_llm_json(raw: str) -> dict:
    cleaned = raw.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except Exception:
        pass

    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        return json.loads(match.group(0))

    raise ValueError("Could not parse model JSON output")


async def analyze_with_ai(resume_text: str, job_description: str):
    prompt = f"""
Return ONLY valid JSON.

{{
  "match_score": number,
  "summary": "...",
  "matched_skills": [],
  "missing_skills": [],
  "suggestions": [],
  "strengths": []
}}

Resume:
{resume_text}

Job Description:
{job_description}
"""

    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    content = response.choices[0].message.content
    return _parse_llm_json(content)


@api_router.get("/")
async def root():
    return {"service": "HireSense AI", "status": "ok"}


@api_router.post("/analyze", response_model=AnalysisResult)
async def analyze(
    job_description: str = Form(...),
    resume_text: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
):
    if not job_description or len(job_description.strip()) < 20:
        raise HTTPException(status_code=400, detail="Job description too short.")

    text = ""
    filename = None

    if resume_file:
        filename = resume_file.filename
        data = await resume_file.read()
        text = extract_text_from_file(filename, data)
    elif resume_text:
        text = resume_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Provide resume")

    try:
        analysis = await analyze_with_ai(text, job_description)
    except Exception as e:
        print("AI ERROR:", e)
        analysis = {
            "match_score": 50,
            "summary": "Fallback",
            "matched_skills": [],
            "missing_skills": [],
            "suggestions": [],
            "strengths": []
        }

    doc_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    return AnalysisResult(
        id=doc_id,
        resume_filename=filename,
        created_at=created_at,
        **analysis
    )


app.include_router(api_router)

logging.basicConfig(level=logging.INFO)

@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()