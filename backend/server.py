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
import requests

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

# PayPal configuration
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "")
PAYPAL_SECRET = os.getenv("PAYPAL_SECRET", "")
PAYPAL_PLAN_ID = os.getenv("PAYPAL_PLAN_ID", "")
PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox")  # sandbox or live
PAYPAL_BASE_URL = f"https://api-m.{PAYPAL_MODE}.paypal.com" if PAYPAL_MODE == "sandbox" else "https://api-m.paypal.com"

def get_paypal_access_token():
    """Get PayPal access token"""
    url = f"{PAYPAL_BASE_URL}/v1/oauth2/token"
    headers = {
        "Accept": "application/json",
        "Accept-Language": "en_US",
    }
    data = {
        "grant_type": "client_credentials"
    }
    
    response = requests.post(url, headers=headers, data=data, auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET))
    
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

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
        response = openai_client.audio.transcriptions.create(
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
        
        transcription = openai_client.audio.transcriptions.create(
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
        
        gpt_response = openai_client.chat.completions.create(
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

# PayPal Subscription Endpoints
class CheckoutRequest(BaseModel):
    user_id: str

class CancelRequest(BaseModel):
    user_id: str

@app.get("/api/subscription/status")
async def get_subscription_status(user_id: str):
    """Check if user has active subscription"""
    try:
        # Find user's subscription in database
        subscription = await db.subscriptions.find_one({"user_id": user_id})
        
        if not subscription:
            return {
                "success": True,
                "is_subscribed": False,
                "status": "inactive"
            }
        
        # Check if subscription is active
        is_active = subscription.get("status") == "active"
        
        return {
            "success": True,
            "is_subscribed": is_active,
            "status": subscription.get("status", "inactive"),
            "subscription_id": subscription.get("paypal_subscription_id")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/subscription/create-checkout")
async def create_paypal_subscription(request: CheckoutRequest):
    """Create PayPal subscription for user"""
    try:
        if not PAYPAL_CLIENT_ID or not PAYPAL_PLAN_ID:
            return {
                "success": False,
                "message": "PayPal not configured. Please add PayPal credentials to .env file"
            }
        
        # Get PayPal access token
        access_token = get_paypal_access_token()
        if not access_token:
            return {"success": False, "message": "Failed to authenticate with PayPal"}
        
        # Create PayPal subscription
        url = f"{PAYPAL_BASE_URL}/v1/billing/subscriptions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
            "Prefer": "return=representation"
        }
        
        subscription_data = {
            "plan_id": PAYPAL_PLAN_ID,
            "custom_id": request.user_id,
            "application_context": {
                "brand_name": "Ghost Hunter Pro",
                "return_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/?subscription=success&user_id={request.user_id}",
                "cancel_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/paywall?canceled=true",
                "user_action": "SUBSCRIBE_NOW"
            }
        }
        
        response = requests.post(url, headers=headers, json=subscription_data)
        
        if response.status_code == 201:
            subscription = response.json()
            subscription_id = subscription["id"]
            
            # Get approval link
            approval_link = None
            for link in subscription.get("links", []):
                if link.get("rel") == "approve":
                    approval_link = link.get("href")
                    break
            
            if approval_link:
                return {
                    "success": True,
                    "checkout_url": approval_link,
                    "subscription_id": subscription_id
                }
            else:
                return {"success": False, "message": "No approval link found"}
        else:
            return {
                "success": False,
                "message": f"PayPal error: {response.text}"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Subscription creation failed: {str(e)}")

@app.post("/api/subscription/verify")
async def verify_paypal_subscription(subscription_id: str, user_id: str):
    """Verify PayPal subscription and activate"""
    try:
        if not PAYPAL_CLIENT_ID:
            return {"success": False, "message": "PayPal not configured"}
        
        # Get PayPal access token
        access_token = get_paypal_access_token()
        if not access_token:
            return {"success": False, "message": "Failed to authenticate with PayPal"}
        
        # Get subscription details from PayPal
        url = f"{PAYPAL_BASE_URL}/v1/billing/subscriptions/{subscription_id}"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            subscription = response.json()
            status = subscription.get("status")
            
            if status in ["ACTIVE", "APPROVED"]:
                # Activate subscription in database
                await db.subscriptions.update_one(
                    {"user_id": user_id},
                    {
                        "$set": {
                            "user_id": user_id,
                            "paypal_subscription_id": subscription_id,
                            "status": "active",
                            "paypal_status": status,
                            "created_at": datetime.utcnow().isoformat(),
                            "updated_at": datetime.utcnow().isoformat()
                        }
                    },
                    upsert=True
                )
                
                return {
                    "success": True,
                    "is_subscribed": True,
                    "message": "Subscription activated"
                }
            else:
                return {
                    "success": False,
                    "is_subscribed": False,
                    "message": f"Subscription status: {status}"
                }
        else:
            return {"success": False, "message": f"Failed to verify subscription: {response.text}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@app.post("/api/subscription/webhook")
async def paypal_webhook(request: dict):
    """Handle PayPal webhooks for subscription events"""
    try:
        event_type = request.get("event_type")
        resource = request.get("resource", {})
        
        if event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
            # Subscription activated
            subscription_id = resource.get("id")
            custom_id = resource.get("custom_id")  # This is our user_id
            
            await db.subscriptions.update_one(
                {"user_id": custom_id},
                {
                    "$set": {
                        "user_id": custom_id,
                        "paypal_subscription_id": subscription_id,
                        "status": "active",
                        "paypal_status": "ACTIVE",
                        "updated_at": datetime.utcnow().isoformat()
                    }
                },
                upsert=True
            )
            
        elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
            # Subscription cancelled
            subscription_id = resource.get("id")
            
            await db.subscriptions.update_one(
                {"paypal_subscription_id": subscription_id},
                {
                    "$set": {
                        "status": "cancelled",
                        "paypal_status": "CANCELLED",
                        "updated_at": datetime.utcnow().isoformat()
                    }
                }
            )
        
        elif event_type == "BILLING.SUBSCRIPTION.SUSPENDED":
            # Subscription suspended (payment failed)
            subscription_id = resource.get("id")
            
            await db.subscriptions.update_one(
                {"paypal_subscription_id": subscription_id},
                {
                    "$set": {
                        "status": "suspended",
                        "paypal_status": "SUSPENDED",
                        "updated_at": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/subscription/cancel")
async def cancel_paypal_subscription(request: CancelRequest):
    """Cancel user's PayPal subscription"""
    try:
        # Find user's subscription
        subscription = await db.subscriptions.find_one({"user_id": request.user_id})
        
        if not subscription:
            return {"success": False, "message": "No active subscription found"}
        
        if not PAYPAL_CLIENT_ID:
            return {"success": False, "message": "PayPal not configured"}
        
        # Get PayPal access token
        access_token = get_paypal_access_token()
        if not access_token:
            return {"success": False, "message": "Failed to authenticate with PayPal"}
        
        # Cancel in PayPal
        paypal_subscription_id = subscription.get("paypal_subscription_id")
        if paypal_subscription_id:
            url = f"{PAYPAL_BASE_URL}/v1/billing/subscriptions/{paypal_subscription_id}/cancel"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }
            data = {
                "reason": "User requested cancellation"
            }
            
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code not in [200, 204]:
                return {"success": False, "message": f"PayPal cancellation failed: {response.text}"}
        
        # Update in database
        await db.subscriptions.update_one(
            {"user_id": request.user_id},
            {
                "$set": {
                    "status": "cancelled",
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        return {"success": True, "message": "Subscription cancelled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/subscription/dev-activate")
async def dev_activate_subscription(request: CheckoutRequest):
    """Development mode: Activate subscription without payment (TESTING ONLY)"""
    try:
        # Activate subscription in database
        await db.subscriptions.update_one(
            {"user_id": request.user_id},
            {
                "$set": {
                    "user_id": request.user_id,
                    "paypal_subscription_id": "dev_sub_" + request.user_id,
                    "status": "active",
                    "is_dev_mode": True,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            },
            upsert=True
        )
        
        return {
            "success": True,
            "is_subscribed": True,
            "message": "Development subscription activated"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
