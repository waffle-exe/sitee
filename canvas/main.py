import os
import re
import asyncio
import base64
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Body, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv
import requests

# Set BASE_DIR first so we can securely locate files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Ensure .env loads properly no matter where the terminal is running
env_path = os.path.join(BASE_DIR, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
elif os.path.exists(os.path.join(BASE_DIR, "..", ".env")):
    load_dotenv(os.path.join(BASE_DIR, "..", ".env"))
else:
    load_dotenv()

# AI SDKs
import openai

# Firebase Admin
import firebase_admin
from firebase_admin import credentials, auth, firestore, storage

app = FastAPI(title="Sitee AI Backend", version="6.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sitee-7nuk.vercel.app",
        "https://www.sitee.in",
        "https://canvas.sitee.in",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- INITIALIZATION ----------------

try:
    cred_path = os.path.join(BASE_DIR, "firebase-service-account.json")

    if os.path.exists(cred_path):
        print("Successfully loaded Firebase Service Account key.")
        cred = credentials.Certificate(cred_path)
    else:
        raise FileNotFoundError(f"Could not find the file at: {cred_path}")
        
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred, {
            'storageBucket': os.getenv("FIREBASE_STORAGE_BUCKET", "sitee-f6a0c.appspot.com")
        })
        
    db = firestore.client()
    bucket = storage.bucket()
    
except Exception as e:
    print("\n" + "!"*75)
    print("CRITICAL ERROR: Firebase Admin initialization failed!")
    print("!"*75)
    print(f"Error Details: {str(e)}")
    print("\nPlease make sure 'firebase-service-account.json' is inside the 'canvas' folder.")
    print("!"*75 + "\n")
    import sys
    sys.exit(1)

# Initialize AI Clients
client_bluesminds = openai.AsyncOpenAI(
    api_key=os.getenv("BLUESMINDS_API_KEY") or "MISSING_KEY",
    base_url="https://api.bluesminds.com/v1",
    max_retries=0
)

client_fireworks = openai.AsyncOpenAI(
    api_key=os.getenv("FIREWORKS_API_KEY") or "MISSING_KEY",
    base_url="https://api.fireworks.ai/inference/v1",
    max_retries=0
)

# Vercel Config
VERCEL_TOKEN = os.getenv("VERCEL_ACCESS_TOKEN")
VERCEL_TEAM_ID = os.getenv("VERCEL_TEAM_ID")

CHAT_HISTORY_PROJECT_NAME = "__chat_history__"
security = HTTPBearer()

# ---------------- PYDANTIC MODELS ----------------

class GenerateRequest(BaseModel):
    prompt: str
    is_chat_mode: bool = False
    user_id: str
    is_punjabi_mode: bool = False
    image_data: Optional[List[str]] = None
    image_size_bytes: Optional[int] = None
    target_language: Optional[str] = "html"
    existing_html: Optional[str] = None
    
class UpgradeRequest(BaseModel):
    plan_tier: str  # "creator" or "pro"
    billing_cycle: str  # "monthly" or "yearly"

class FirebaseConfigRequest(BaseModel):
    apiKey: str
    authDomain: str
    databaseURL: Optional[str] = None  
    projectId: str
    storageBucket: str
    messagingSenderId: str
    appId: str
    measurementId: Optional[str] = None  

# ---------------- HELPER FUNCTIONS ----------------

async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    try:
        token = creds.credentials
        decoded_token = auth.verify_id_token(token, check_revoked=False)
        return {
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email", "")
        }
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid or expired token: {str(e)}"
        )
    
def clean_ai_html(raw_html: str) -> str:
    clean = raw_html.strip()
    clean = re.sub(r"^```[a-zA-Z]*\s*\n", "", clean, flags=re.IGNORECASE)
    clean = re.sub(r"\n?\s*```$", "", clean)
    clean = re.sub(r"<think>.*?</think>", "", clean, flags=re.DOTALL)
    return clean.strip()

def get_user_profile(uid: str, email: str = "") -> dict:
    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()
    
    if not doc.exists:
        user_data = {
            "id": uid,
            "email": email,
            "credits": 10, 
            "subscriptionTier": "free",
            "plan_validity": None,  
            "storage_used_mb": 0.0,
            "projects": []
        }
        user_ref.set(user_data)
    else:
        user_data = doc.to_dict()
        if "id" not in user_data:
            user_data["id"] = uid
            
        plan_validity_str = user_data.get("plan_validity")
        if plan_validity_str:
            try:
                expiry_date = datetime.fromisoformat(plan_validity_str)
                if datetime.now(timezone.utc) > expiry_date:
                    user_data["subscriptionTier"] = "free"
                    user_data["credits"] = 10  
                    user_data["plan_validity"] = None
                    user_ref.update({
                        "subscriptionTier": "free",
                        "credits": 10,
                        "plan_validity": None
                    })
            except Exception as e:
                pass
            
    existing_projects_array = user_data.get("projects", [])
    if not isinstance(existing_projects_array, list):
        existing_projects_array = []
    
    projects_subcol = []
    try:
        projects_ref = user_ref.collection("projects").order_by("timestamp", direction=firestore.Query.DESCENDING)
        for proj_doc in projects_ref.stream():
            projects_subcol.append(proj_doc.to_dict())
    except Exception as e:
        pass
        
    subcol_timestamps = {str(p.get("timestamp")) for p in projects_subcol}
    combined_projects = list(projects_subcol)
    
    for p in existing_projects_array:
        if str(p.get("timestamp")) not in subcol_timestamps:
            combined_projects.append(p)
            
    combined_projects.sort(key=lambda x: int(x.get("timestamp", 0)), reverse=True)
    user_data["projects"] = combined_projects
    return user_data


async def generate_with_fallback(prompt: str, images: Optional[List[str]] = None, target_lang: str = "html") -> dict:
    system_instruction = f"""
You are an expert UX/UI Frontend Developer specializing in minimalist, brutalist, and modern academic design. Your ONLY task is to output a single, complete, production-ready {target_lang.upper()} file containing HTML, CSS, and JS.

CRITICAL DESIGN DIRECTIVES:
1. PREMIUM AESTHETICS: Avoid "cheap" default looks and emojis. Use generous padding (p-8, p-12), high-contrast text (text-zinc-900 vs text-zinc-500), and sharp, intentional typography.
2. MODERN TAILWIND: Rely on sleek Tailwind utility combinations. Use `tracking-tight`, `antialiased`, subtle borders (`border border-zinc-200`), and minimalist shadows (`shadow-sm` or hard shadows for a brutalist feel). Avoid heavy gradients or dated CSS styling.
3. FULL PAGE STRUCTURE: You MUST generate a complete, multi-section website including a functional Navigation Bar, Hero Section, Main Content Area, and Footer. 
4. NO LAZINESS: Do NOT output placeholder screens. Build the actual UI with realistic dummy text and placeholder images from Unsplash.
5. ALL-IN-ONE-FILE: Output RAW, executable text from the first character to the last. No markdown blocks (e.g., no ```html). No <think> tags.
"""

    messages_ai = [{"role": "system", "content": system_instruction}]
    
    # 1. Dynamically select the model and format the payload based on image presence
    if images:
        target_model = "gemini-3.1-flash-lite-preview"
        content = [{"type": "text", "text": prompt}]
        for b64_img in images:
            if "," in b64_img: 
                b64_img = b64_img.split(",")[1]
            content.append({
                "type": "image_url", 
                "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"}
            })
        messages_ai.append({"role": "user", "content": content})
    else:
        target_model = "deepseek-v4-flash"
        messages_ai.append({"role": "user", "content": prompt})

    bluesminds_error = None

    # 2. Primary Execution Block: Bluesminds
    try:
        print(f"Attempting generation with Bluesminds API using model: {target_model}...")
        response = await client_bluesminds.chat.completions.create(
            model=target_model,
            messages=messages_ai,
            max_tokens=8000,
            temperature=0.15,  # Low temperature keeps generation crisp, precise, and structurally sound
            timeout=180.0
        )
        print("Bluesminds successful!")
        return {
            "html": clean_ai_html(response.choices[0].message.content),
            "tokens": response.usage.total_tokens if response.usage else 0
        }
    except Exception as e:
        bluesminds_error = str(e)
        print(f"Bluesminds Failed using {target_model}: {bluesminds_error}")
    
    # 3. Clean Failure Handling (Fireworks Fallback Disabled)
    error_message = f"Bluesminds Generation Failed ({target_model}). Error: {bluesminds_error}"
    raise HTTPException(status_code=503, detail=error_message)

# ---------------- API ENDPOINTS ----------------

@app.post("/upgrade-user-plan/")
async def upgrade_user_plan(req: UpgradeRequest, current_user: dict = Depends(get_current_user)):
    uid = current_user['uid']
    user_ref = db.collection("users").document(uid)
    
    plan_credits = {"creator": 300, "pro": 1200}
    tier = req.plan_tier.lower()
    cycle = req.billing_cycle.lower()
    
    if tier not in plan_credits:
        raise HTTPException(status_code=400, detail="Invalid plan tier.")
    if cycle not in ["monthly", "yearly"]:
        raise HTTPException(status_code=400, detail="Invalid billing cycle.")
        
    now = datetime.now(timezone.utc)
    expiry_date = now + timedelta(days=30) if cycle == "monthly" else now + timedelta(days=365)
    allocated_credits = plan_credits[tier] if cycle == "monthly" else plan_credits[tier] * 12 

    user_ref.update({
        "subscriptionTier": f"{tier}_{cycle}", 
        "credits": firestore.Increment(allocated_credits),
        "plan_validity": expiry_date.isoformat()
    })
    
    return {
        "status": "success",
        "tier": f"{tier}_{cycle}",
        "credits_added": allocated_credits,
        "expires_at": expiry_date.isoformat()
    }

@app.post("/create-user")
async def create_user(current_user: dict = Depends(get_current_user)):
    get_user_profile(current_user.get("uid"), current_user.get("email", ""))
    return {"status": "success"}

@app.get("/users/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return get_user_profile(current_user.get("uid"), current_user.get("email", ""))

@app.post("/generate/")
async def generate_code_endpoint(req: GenerateRequest, current_user: dict = Depends(get_current_user)):
    uid = current_user['uid']
    if req.image_data and len(req.image_data) > 3:
        raise HTTPException(status_code=400, detail="Maximum of 3 reference images allowed.")
    
    user_ref = db.collection("users").document(uid)
    user_data = get_user_profile(uid) 
    plan = user_data.get('subscriptionTier', 'free').lower()
    
    if plan == 'free':
        active_projects = [p for p in user_data.get('projects', []) if p.get('name') != CHAT_HISTORY_PROJECT_NAME]
        if len(active_projects) >= 2:
            raise HTTPException(status_code=402, detail="Maximum limit of 2 generations reached for Free Plan.")
    
    TOKEN_COST_RATE = 0.00106
    
    try:
        result = await generate_with_fallback(
            prompt=req.prompt, 
            images=req.image_data, 
            target_lang=req.target_language
        )
        
        total_tokens = result.get("tokens", 0)
        vision_multiplier = 1.8 if bool(req.image_data) else 1.0
        credits_to_deduct = max(2.0, round((total_tokens * TOKEN_COST_RATE) * vision_multiplier, 1))
        
        if plan != 'free':
            if user_data.get('credits', 0) < credits_to_deduct:
                raise HTTPException(status_code=402, detail=f"Requires {credits_to_deduct} credits.")
            user_ref.update({"credits": firestore.Increment(-credits_to_deduct)})
            credits_remaining = user_data.get('credits', 0) - credits_to_deduct
        else:
            credits_to_deduct = 0
            credits_remaining = user_data.get('credits', 0)
            
        return {
            "html": result.get("html"),
            "tokens_used": total_tokens,
            "credits_deducted": credits_to_deduct,
            "credits_remaining": credits_remaining,
            "user_profile": get_user_profile(uid) 
        }
    except Exception as e:
        # Re-raise the exact exception so the 503 from generate_with_fallback bubbles up to the user
        raise e
    
# --- Projects Management ---
@app.post("/users/{user_id}/projects")
async def save_project_endpoint(user_id: str, project: dict = Body(...), current_user: dict = Depends(get_current_user)):
    if current_user['uid'] != user_id: raise HTTPException(status_code=403, detail="Unauthorized")
    timestamp = str(project.get("timestamp"))
    db.collection("users").document(user_id).collection("projects").document(timestamp).set(project)
    return project

@app.put("/users/{user_id}/projects/{timestamp}")
async def update_project_endpoint(user_id: str, timestamp: str, project: dict = Body(...), current_user: dict = Depends(get_current_user)):
    if current_user['uid'] != user_id: raise HTTPException(status_code=403, detail="Unauthorized")
    doc_ref = db.collection("users").document(user_id).collection("projects").document(timestamp)
    if not doc_ref.get().exists: doc_ref.set(project)
    else: doc_ref.update(project)
    return project

@app.delete("/users/{user_id}/projects/{timestamp}")
async def delete_project_endpoint(user_id: str, timestamp: str, current_user: dict = Depends(get_current_user)):
    if current_user['uid'] != user_id: raise HTTPException(status_code=403, detail="Unauthorized")
    db.collection("users").document(user_id).collection("projects").document(timestamp).delete()
    return {"status": "success"}

@app.delete("/users/{user_id}/projects")
async def delete_all_projects_endpoint(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['uid'] != user_id: raise HTTPException(status_code=403, detail="Unauthorized")
    projects_ref = db.collection("users").document(user_id).collection("projects")
    for doc in projects_ref.stream():
        if doc.id != CHAT_HISTORY_PROJECT_NAME: doc.reference.delete()
    return {"status": "success"}

# --- File Upload ---
@app.post("/upload-image/{project_id}")
async def upload_image_endpoint(
    project_id: str, 
    file: UploadFile = File(...), 
    file_size_bytes: int = Form(default=0),
    current_user: dict = Depends(get_current_user)
):
    uid = current_user['uid']
    try:
        destination_blob_name = f"{uid}/{project_id}/{file.filename}"
        blob_obj = bucket.blob(destination_blob_name)
        blob_obj.upload_from_file(file.file, content_type=file.content_type)
        blob_obj.make_public()
        public_url = blob_obj.public_url
    except Exception:
        public_url = f"[https://storage.sitee.in/uploads/](https://storage.sitee.in/uploads/){uid}/{file.filename}"
    
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get().to_dict() or {}
    new_mb = user_doc.get("storage_used_mb", 0.0) + (file_size_bytes / (1024 * 1024))
    user_ref.update({"storage_used_mb": new_mb})
    return {"url": public_url, "user_profile": get_user_profile(uid)}

# --- Deployment & Publishing ---
@app.post("/users/{user_id}/projects/{timestamp}/publish")
async def publish_external_endpoint(user_id: str, timestamp: str, content: dict = Body(...), current_user: dict = Depends(get_current_user)):
    uid = current_user['uid']
    if uid != user_id: raise HTTPException(status_code=403, detail="Unauthorized")
        
    user_doc = db.collection('users').document(uid).get()
    if not user_doc.exists or user_doc.to_dict().get("subscriptionTier", "free") == "free":
        raise HTTPException(status_code=403, detail="Publishing is a premium feature.")
        
    if not VERCEL_TOKEN: raise HTTPException(status_code=500, detail="Vercel missing.")

    project_name = content.get("project_name", f"sitee-{uid.lower()[:8]}-{timestamp}")
    payload = {"name": project_name, "files": [{"file": "index.html", "data": content.get("html_content", "")}]}
    headers = {"Authorization": f"Bearer {VERCEL_TOKEN}"}
    if VERCEL_TEAM_ID: headers["x-vercel-team-id"] = VERCEL_TEAM_ID

    try:
        response = requests.post("[https://api.vercel.com/v13/deployments](https://api.vercel.com/v13/deployments)", headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        deployment_url = f"https://{response.json()['url']}"
        db.collection("users").document(uid).collection("projects").document(timestamp).update({"published_url": deployment_url})
        return {"url": deployment_url}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail="Publishing error.")

@app.put("/users/{user_id}/projects/{timestamp}/publish")
async def update_external_publish_endpoint(user_id: str, timestamp: str, content: dict = Body(...), current_user: dict = Depends(get_current_user)):
    return await publish_external_endpoint(user_id, timestamp, content, current_user)

@app.get("/check-subdomain-availability")
async def check_subdomain_endpoint(name: str, current_user: dict = Depends(get_current_user)):
    if name.lower() in ["admin", "sitee", "test", "app"]:
        return {"available": False, "suggestions": [f"{name}-web", f"my-{name}", f"{name}-online"]}
    return {"available": True}

@app.post("/publish-sitee")
async def publish_sitee_endpoint(req: dict = Body(...), current_user: dict = Depends(get_current_user)):
    uid = current_user['uid']
    timestamp = str(req.get("project_timestamp"))
    published_url = f"https://{req.get('subdomain')}-app.sitee.in"
    doc_ref = db.collection("users").document(uid).collection("projects").document(timestamp)
    if doc_ref.get().exists: 
        doc_ref.update({"published_url": published_url, "html": req.get("html_content")})
    return {"url": published_url, "status": "success"}

@app.delete("/unpublish-sitee/{timestamp}")
async def unpublish_sitee_endpoint(timestamp: str, current_user: dict = Depends(get_current_user)):
    doc_ref = db.collection("users").document(current_user['uid']).collection("projects").document(timestamp)
    if doc_ref.get().exists: doc_ref.update({"published_url": None})
    return {"status": "success"}

@app.post("/users/me/github-token")
async def save_github_token_endpoint(req: dict = Body(...), current_user: dict = Depends(get_current_user)):
    db.collection("users").document(current_user['uid']).update({
        "github_token": req.get("github_token"),
        "github_token_expiry": str(firestore.SERVER_TIMESTAMP)
    })
    return {"status": "success"}

@app.delete("/users/me/github-token")
async def remove_github_token_endpoint(current_user: dict = Depends(get_current_user)):
    db.collection("users").document(current_user['uid']).update({"github_token": None, "github_token_expiry": None})
    return {"status": "success"}

@app.post("/deploy-github")
async def deploy_github_endpoint(req: dict = Body(...), current_user: dict = Depends(get_current_user)):
    user_doc = db.collection("users").document(current_user['uid']).get().to_dict()
    if not user_doc.get("github_token"): raise HTTPException(status_code=401, detail="GitHub token missing.")
    return {"url": f"[https://github.com/your-username/](https://github.com/your-username/){req.get('repo_name')}", "status": "success"}

@app.post("/suggest_improvements/")
async def suggest_improvements_endpoint(req: dict = Body(...), current_user: dict = Depends(get_current_user)):
    uid = current_user['uid']
    user_ref = db.collection("users").document(uid)
    if user_ref.get().to_dict().get("credits", 0) < 1: raise HTTPException(status_code=403, detail="Insufficient credits.")
    user_ref.update({"credits": firestore.Increment(-1)})
    return {"suggestions": [{"description": "Improve contrast.", "selector": "button", "new_outer_html": "<button>Improved</button>"}], "user_profile": get_user_profile(uid)}

@app.post("/apply-suggestion-fix/")
async def apply_suggestion_endpoint(req: dict = Body(...), current_user: dict = Depends(get_current_user)):
    return {"new_html": req.get("new_outer_html")}

# --- Firebase Config Endpoints ---
@app.post("/users/me/firebase-config")
async def save_firebase_config(req: FirebaseConfigRequest, current_user: dict = Depends(get_current_user)):
    try:
        user_ref = db.collection("users").document(current_user['uid'])
        try: user_ref.update({"projects": firestore.DELETE_FIELD})
        except: pass 
        user_ref.set({"custom_firebase_config": req.dict()}, merge=True)
        return {"status": "success", "message": "Firebase config saved!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/users/me/firebase-config")
async def delete_firebase_config(current_user: dict = Depends(get_current_user)):
    try:
        db.collection("users").document(current_user['uid']).update({"custom_firebase_config": firestore.DELETE_FIELD})
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ---------------- CATCH-ALL ROUTE FOR DYNAMIC SUBDOMAINS ----------------
@app.get("/{path:path}")
async def serve_dynamic_subdomain(request: Request, path: str):
    host = request.headers.get("host", "")
    if "sitee.in" in host and not host.startswith("www."):
        protocol = request.headers.get("x-forwarded-proto", "https")
        target_url = f"{protocol}://{host}"
        
        projects_ref = db.collection_group("projects").where("published_url", "==", target_url).limit(1).stream()
        for doc in projects_ref:
            return HTMLResponse(content=doc.to_dict().get("html", "<h1>No content</h1>"), status_code=200)
        
        return HTMLResponse(content="<h1>Site Not Found or Unpublished</h1>", status_code=404)
    raise HTTPException(status_code=404, detail="Not Found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
