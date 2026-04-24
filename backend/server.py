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
from pydantic import BaseModel, Field
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
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

# Single app instance with CORS middleware
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
    raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")


SYSTEM_PROMPT = """You are HireSense AI, an expert ATS (Applicant Tracking System) and career coach.
Your job is to compare a candidate's resume against a job description and return a strict JSON analysis.

Rules:
- Be objective and evidence-based.
- Only mark skills as "matched" if they explicitly appear (or clear synonyms) in the resume AND are relevant to the JD.
- "missing_skills" = required/preferred skills in the JD that are NOT found in the resume.
- "suggestions" = concrete, actionable ways the candidate can improve the resume to better fit this role.
- "strengths" = the top things this candidate has going for them for this role.
- match_score is an integer 0-100 reflecting overall fit.
- Respond ONLY with raw JSON. No markdown, no prose, no code fences.

JSON schema:
{
  "match_score": <int 0-100>,
  "summary": "<2-3 sentence recruiter-style summary>",
  "matched_skills": ["skill1", "skill2", ...],
  "missing_skills": ["skillA", "skillB", ...],
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "strengths": ["strength 1", "strength 2", ...]
}
"""


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
        extra_headers={
            "HTTP-Referer": "https://uttamcv.vercel.app",
            "X-Title": "UttamCV"
        }
    )

    content = response.choices[0].message.content
    content = re.sub(r"```json|```", "", content).strip()

    return json.loads(content)


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
        raise HTTPException(status_code=400, detail="Job description is too short (min 20 chars).")

    text = ""
    filename = None
    if resume_file is not None:
        filename = resume_file.filename
        data = await resume_file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        text = extract_text_from_file(filename, data)
    elif resume_text:
        text = resume_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Provide a resume file or resume_text.")

    if len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract enough resume text. Please try another file.")

 try:
    analysis = await analyze_with_ai(text, job_description)
except Exception as e:
    print("AI ERROR:", e)
    analysis = {
        "match_score": 50,
        "summary": "AI failed, fallback result",
        "matched_skills": [],
        "missing_skills": [],
        "suggestions": [],
        "strengths": []
    }

    doc_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": doc_id,
        "resume_filename": filename,
        "resume_text": text,
        "job_description": job_description,
        "created_at": created_at,
        **analysis,
    }
    print("Skipping DB save")

    return AnalysisResult(
        id=doc_id,
        resume_filename=filename,
        created_at=created_at,
        **analysis,
    )


@api_router.get("/analyses/{analysis_id}", response_model=AnalysisResult)
async def get_analysis(analysis_id: str):
    doc = await db.analyses.find_one(
        {"id": analysis_id},
        {"_id": 0, "resume_text": 0, "job_description": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return AnalysisResult(**doc)


def _build_pdf_report(doc: dict) -> bytes:
    buf = io.BytesIO()
    pdf = SimpleDocTemplate(
        buf, pagesize=LETTER,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
        topMargin=0.7 * inch, bottomMargin=0.7 * inch,
        title="HireSense AI Report",
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Brand", fontName="Helvetica-Bold",
                              fontSize=22, textColor=colors.HexColor("#09090B"), spaceAfter=2))
    styles.add(ParagraphStyle(name="SubBrand", fontName="Helvetica",
                              fontSize=10, textColor=colors.HexColor("#52525B"), spaceAfter=18))
    styles.add(ParagraphStyle(name="H2", fontName="Helvetica-Bold",
                              fontSize=14, textColor=colors.HexColor("#09090B"),
                              spaceBefore=16, spaceAfter=8))
    styles.add(ParagraphStyle(name="Body", fontName="Helvetica",
                              fontSize=10.5, textColor=colors.HexColor("#18181B"), leading=15))
    styles.add(ParagraphStyle(name="Mono", fontName="Helvetica",
                              fontSize=9, textColor=colors.HexColor("#52525B")))

    story = []
    story.append(Paragraph("HireSense AI", styles["Brand"]))
    story.append(Paragraph("Resume vs. Job Description Analysis Report", styles["SubBrand"]))

    score = int(doc.get("match_score", 0))
    score_color = "#10B981" if score >= 75 else ("#F59E0B" if score >= 50 else "#EF4444")
    meta_rows = [
        ["Match Score", f'<font color="{score_color}"><b>{score}/100</b></font>'],
        ["Resume File", doc.get("resume_filename") or "Pasted text"],
        ["Generated", doc.get("created_at", "")[:19].replace("T", " ") + " UTC"],
        ["Analysis ID", doc.get("id", "")],
    ]
    table_data = [[Paragraph(k, styles["Body"]), Paragraph(v, styles["Body"])] for k, v in meta_rows]
    table = Table(table_data, colWidths=[1.5 * inch, 5.3 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#FAFAFA")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E4E4E7")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E4E4E7")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(table)

    story.append(Paragraph("Executive Summary", styles["H2"]))
    story.append(Paragraph(doc.get("summary", "—"), styles["Body"]))

    def bullet_list(title, items, color_hex):
        story.append(Paragraph(title, styles["H2"]))
        if not items:
            story.append(Paragraph("None identified.", styles["Body"]))
            return
        for it in items:
            story.append(Paragraph(f'<font color="{color_hex}">●</font> &nbsp; {it}', styles["Body"]))
            story.append(Spacer(1, 2))

    bullet_list("Matched Skills", doc.get("matched_skills", []), "#10B981")
    bullet_list("Missing Skills", doc.get("missing_skills", []), "#EF4444")
    bullet_list("Your Strengths", doc.get("strengths", []), "#2563EB")
    bullet_list("Actionable Suggestions", doc.get("suggestions", []), "#2563EB")

    story.append(Spacer(1, 20))
    story.append(Paragraph("Generated by HireSense AI · Powered by Claude Sonnet 4.5", styles["Mono"]))

    pdf.build(story)
    buf.seek(0)
    return buf.getvalue()


@api_router.get("/report/{analysis_id}")
async def download_report(analysis_id: str):
    doc = await db.analyses.find_one({"id": analysis_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")
    pdf_bytes = _build_pdf_report(doc)
    headers = {
        "Content-Disposition": f'attachment; filename="hiresense-report-{analysis_id[:8]}.pdf"'
    }
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)


app.include_router(api_router)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()