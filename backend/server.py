from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
from dotenv import load_dotenv
import base64
import openai
from bson import ObjectId
import io

load_dotenv()

app = FastAPI(title="Ghost Hunting API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.ghost_hunting

# OpenAI with Emergent LLM Key
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "sk-emergent-9Cc27A503E11d92298")
openai_client = openai.OpenAI(api_key=EMERGENT_LLM_KEY)

# Models
class Session(BaseModel):
    name: str
    location: str
    date: str
    notes: Optional[str] = ""

class Recording(BaseModel):
    session_id: str
    audio_base64: str
    type: str  # 'voice', 'evp', 'spirit_box'
    timestamp: str
    transcription: Optional[str] = ""

class EVPAnalysis(BaseModel):
    recording_id: str
    anomalies_detected: List[str]
    ai_analysis: str
    confidence: float

# Helper function
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

@app.get("/")
async def root():
    return {"message": "Ghost Hunting API", "status": "active"}

# Session endpoints
@app.post("/api/sessions")
async def create_session(session: Session):
    session_dict = session.dict()
    session_dict["created_at"] = datetime.utcnow().isoformat()
    result = await db.sessions.insert_one(session_dict)
    session_dict["id"] = str(result.inserted_id)
    return {"success": True, "session": serialize_doc(session_dict)}

@app.get("/api/sessions")
async def get_sessions():
    sessions = []
    async for session in db.sessions.find().sort("created_at", -1):
        sessions.append(serialize_doc(session))
    return {"success": True, "sessions": sessions}

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"success": True, "session": serialize_doc(session)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    try:
        result = await db.sessions.delete_one({"_id": ObjectId(session_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        # Delete associated recordings
        await db.recordings.delete_many({"session_id": session_id})
        return {"success": True, "message": "Session deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Recording endpoints
@app.post("/api/recordings")
async def create_recording(recording: Recording):
    recording_dict = recording.dict()
    recording_dict["created_at"] = datetime.utcnow().isoformat()
    result = await db.recordings.insert_one(recording_dict)
    recording_dict["id"] = str(result.inserted_id)
    return {"success": True, "recording": serialize_doc(recording_dict)}

@app.get("/api/recordings/{session_id}")
async def get_recordings(session_id: str):
    recordings = []
    async for recording in db.recordings.find({"session_id": session_id}).sort("created_at", -1):
        recordings.append(serialize_doc(recording))
    return {"success": True, "recordings": recordings}

# Transcription endpoint
@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        # Read audio file
        audio_data = await file.read()
        
        # Create a file-like object for OpenAI
        audio_file = io.BytesIO(audio_data)
        audio_file.name = file.filename or "audio.m4a"
        
        # Call OpenAI Whisper
        response = openai.Audio.transcribe(
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )
        
        return {
            "success": True,
            "transcription": response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

# EVP Analysis endpoint
@app.post("/api/analyze-evp")
async def analyze_evp(recording_id: str, audio_base64: str):
    try:
        # First, transcribe the audio
        audio_bytes = base64.b64decode(audio_base64)
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "evp_audio.m4a"
        
        transcription = openai.Audio.transcribe(
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )
        
        # Use GPT to analyze for anomalies
        analysis_prompt = f"""
Analyze this EVP (Electronic Voice Phenomenon) recording transcription for paranormal activity.
Transcription: "{transcription}"

Look for:
1. Unusual words or phrases that seem out of context
2. Repetitive patterns
3. Words that might be names, dates, or locations
4. Any indications of communication attempts
5. Background anomalies or unexplained sounds

Provide a detailed analysis with confidence level (0-100%).
"""
        
        gpt_response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a paranormal investigator AI assistant analyzing EVP recordings."},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=0.7
        )
        
        ai_analysis = gpt_response.choices[0].message.content
        
        # Extract anomalies (simplified)
        anomalies = []
        if len(transcription) > 0:
            words = transcription.split()
            if len(words) < 10:  # Short, unusual phrases
                anomalies.append("Brief communication detected")
            if any(word.lower() in ['help', 'here', 'yes', 'no'] for word in words):
                anomalies.append("Potential response words detected")
        
        # Save analysis to database
        analysis_dict = {
            "recording_id": recording_id,
            "transcription": transcription,
            "anomalies_detected": anomalies,
            "ai_analysis": ai_analysis,
            "confidence": 75.0,  # This would be calculated based on actual analysis
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = await db.evp_analyses.insert_one(analysis_dict)
        analysis_dict["id"] = str(result.inserted_id)
        
        return {
            "success": True,
            "analysis": serialize_doc(analysis_dict)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"EVP analysis failed: {str(e)}")

@app.get("/api/evp-analyses/{recording_id}")
async def get_evp_analysis(recording_id: str):
    analysis = await db.evp_analyses.find_one({"recording_id": recording_id})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"success": True, "analysis": serialize_doc(analysis)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
