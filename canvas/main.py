import os
import re
import asyncio
import base64
import json
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import HTMLResponse, StreamingResponse
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
import google.generativeai as genai

# Firebase Admin
import firebase_admin
from firebase_admin import credentials, auth, firestore, storage

app = FastAPI(title="Sitee AI Backend", version="6.0.8")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sitee-7nuk.vercel.app",
        "https://www.sitee.in",
        "https://canvas.sitee.in",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- INITIALIZATION ----------------

try:
    cred_path = os.path.join(BASE_DIR, "firebase-service-account.json")

    if os.path.exists(cred_path):
        print("✅ Successfully loaded Firebase Service Account key.")
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
    print("🔥 CRITICAL ERROR: Firebase Admin initialization failed! 🔥")
    print("!"*75)
    print(f"Error Details: {str(e)}")
    print("\nPlease make sure 'firebase-service-account.json' is inside the 'canvas' folder.")
    print("!"*75 + "\n")
    import sys
    sys.exit(1)

# Initialize AI Clients
client_fireworks = openai.AsyncOpenAI(
    api_key=os.getenv("FIREWORKS_API_KEY") or "MISSING_KEY",
    base_url="https://api.fireworks.ai/inference/v1"
)

genai.configure(api_key=os.getenv("GEMINI_API_KEY") or "MISSING_KEY")

client_groq = openai.AsyncOpenAI(
    api_key=os.getenv("GROQ_API_KEY") or "MISSING_KEY",
    base_url="https://api.groq.com/openai/v1"
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


# ---------------- HELPER FUNCTIONS ----------------

async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    try:
        token = creds.credentials
        decoded_token = auth.verify_id_token(
            token,
            check_revoked=False
        )

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
            "storage_used_mb": 0.0,
            "projects": []
        }
        user_ref.set(user_data)
    else:
        user_data = doc.to_dict()
        if "id" not in user_data:
            user_data["id"] = uid
            
    existing_projects_array = user_data.get("projects", [])
    if not isinstance(existing_projects_array, list):
        existing_projects_array = []
    
    projects_subcol = []
    try:
        projects_ref = user_ref.collection("projects").order_by("timestamp", direction=firestore.Query.DESCENDING)
        for proj_doc in projects_ref.stream():
            projects_subcol.append(proj_doc.to_dict())
    except Exception as e:
        print(f"Warning fetching projects subcollection: {e}")
        
    subcol_timestamps = {str(p.get("timestamp")) for p in projects_subcol}
    combined_projects = list(projects_subcol)
    
    for p in existing_projects_array:
        if str(p.get("timestamp")) not in subcol_timestamps:
            combined_projects.append(p)
            
    combined_projects.sort(key=lambda x: int(x.get("timestamp", 0)), reverse=True)
    
    user_data["projects"] = combined_projects
    return user_data

# --- NON-STREAMING GENERATOR (Kept for React or fallback) ---
async def generate_with_fallback(prompt: str, images: Optional[List[str]] = None, target_lang: str = "html") -> tuple[str, str]:
    system_instruction = f"""
    You are an elite, top-tier web developer and UX/UI designer. 
    Your ONLY purpose is to output valid, COMPLETE, and beautifully designed production-ready {target_lang.upper()} code.

    CRITICAL DIRECTIVES (YOU MUST FOLLOW THESE OR FAIL):
    0. NO LAZINESS & NO PLACEHOLDERS: You MUST generate the ENTIRE website. Do NOT stop after the header.
    1. ZERO EXPLANATIONS: Absolutely NO markdown commentary.
    2. STRICTLY NO THINKING: Do NOT generate <think> tags.
    3. ALL-IN-ONE-FILE: Combine all HTML, CSS, and JS into ONE file.
    4. NO CODE BLOCKS: Output completely RAW, executable plain text. Do not wrap in ```html.
    5. PREMIUM DESIGN: Use Tailwind CSS CDN.
    6. Ensure the code is complete.
    """

    messages_ai = [{"role": "system", "content": system_instruction}]
    
    if images:
        content = [{"type": "text", "text": prompt}]
        for b64_img in images:
            if "," in b64_img: b64_img = b64_img.split(",")[1]
            content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"}})
        messages_ai.append({"role": "user", "content": content})
    else:
        messages_ai.append({"role": "user", "content": prompt})

    try:
        glm_model = "accounts/fireworks/models/kimi-k2p7-code"
        response = await client_fireworks.chat.completions.create(
            model=glm_model, messages=messages_ai, max_tokens=15000, temperature=0.2, presence_penalty=0.1, timeout=180.0
        )
        return clean_ai_html(response.choices[0].message.content), "glm-5p2"
    except Exception as e:
        print(f"GLM 5.2 Failed/Timed Out: {e}")

    try:
        gemini_model = genai.GenerativeModel(model_name='gemini-1.5-pro-latest', system_instruction=system_instruction)
        gemini_content = [prompt]
        if images:
             for b64_img in images:
                 if "," in b64_img: b64_img = b64_img.split(",")[1]
                 gemini_content.append({"mime_type": "image/jpeg", "data": base64.b64decode(b64_img)})
                 
        generation_config = genai.types.GenerationConfig(temperature=0.2, max_output_tokens=8192)
        response = await gemini_model.generate_content_async(gemini_content, generation_config=generation_config)
        return clean_ai_html(response.text), "gemini-1.5-pro"
    except Exception as e:
        print(f"Gemini Failed: {e}")

    raise HTTPException(status_code=503, detail="All AI models timed out.")

# --- STREAMING GENERATOR ---
async def stream_with_fallback(prompt: str, images: Optional[List[str]] = None, target_lang: str = "html"):
    system_instruction = f"""
    You are an elite, top-tier web developer and UX/UI designer. 
    Your ONLY purpose is to output valid, COMPLETE, and beautifully designed production-ready {target_lang.upper()} code.

    CRITICAL DIRECTIVES:
    0. NO LAZINESS & NO PLACEHOLDERS.
    1. ZERO EXPLANATIONS.
    2. STRICTLY NO THINKING TAGS.
    3. ALL-IN-ONE-FILE.
    4. NO CODE BLOCKS (Do not start with ```html).
    5. PREMIUM DESIGN using Tailwind.
    """

    # If we have images, route directly to Gemini for streaming
    if images:
        try:
            gemini_model = genai.GenerativeModel(model_name='gemini-1.5-pro-latest', system_instruction=system_instruction)
            gemini_content = [prompt]
            for b64_img in images:
                if "," in b64_img: b64_img = b64_img.split(",")[1]
                gemini_content.append({"mime_type": "image/jpeg", "data": base64.b64decode(b64_img)})
            
            response = await gemini_model.generate_content_async(
                gemini_content, 
                generation_config=genai.types.GenerationConfig(temperature=0.2, max_output_tokens=8192),
                stream=True
            )
            
            async for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps({'chunk': chunk.text})}\n\n"
            
            yield f"data: {json.dumps({'done': True})}\n\n"
            return
            
        except Exception as e:
            print(f"Gemini Streaming Failed: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

    # If no images, use Fireworks streaming
    messages_ai = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": prompt}
    ]

    try:
        glm_model = "accounts/fireworks/models/kimi-k2p7-code"
        stream = await client_fireworks.chat.completions.create(
            model=glm_model, 
            messages=messages_ai, 
            max_tokens=15000,   
            temperature=0.2,    
            presence_penalty=0.1,
            stream=True
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                yield f"data: {json.dumps({'chunk': content})}\n\n"
                
        yield f"data: {json.dumps({'done': True})}\n\n"
        
    except Exception as e:
        print(f"Fireworks Streaming Failed: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


# ---------------- API ENDPOINTS ----------------

@app.post("/create-user")
async def create_user(current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid")
    email = current_user.get("email", "")
    get_user_profile(uid, email)
    return {"status": "success"}

@app.get("/users/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid")
    email = current_user.get("email", "")
    return get_user_profile(uid, email)

# NEW: Streaming Endpoint
@app.post("/generate/stream")
async def generate_code_stream_endpoint(req: GenerateRequest, current_user: dict = Depends(get_current_user)):
    uid = current_user['uid']
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    
    user_data = user_doc.to_dict() if user_doc.exists else {}
    
    credit_cost = 20 if req.image_data else 1
    if req.target_language == 'react': credit_cost = 0 
    if req.existing_html: credit_cost = 1 
        
    if user_data.get('credits', 0) < credit_cost:
        raise HTTPException(status_code=402, detail="Insufficient credits")
        
    if credit_cost > 0:
        user_ref.update({"credits": firestore.Increment(-credit_cost)})
        
    try:
        final_prompt = req.prompt
        if req.existing_html:
            final_prompt = f"Modify the following HTML based on this request: '{req.prompt}'.\n\nExisting HTML:\n{req.existing_html}"
        if req.is_punjabi_mode:
            final_prompt = f"Understand this Punjabi context and build the site: {req.prompt}"

        return StreamingResponse(
            stream_with_fallback(
                prompt=final_prompt, 
                images=req.image_data, 
                target_lang=req.target_language or "html"
            ),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        if credit_cost > 0:
            user_ref.update({"credits": firestore.Increment(credit_cost)})
        raise HTTPException(status_code=500, detail=str(e))

# OLD: Standard Generator Endpoint (Retained for backward compatibility)
@app.post("/generate/")
async def generate_code_endpoint(req: GenerateRequest, current_user: dict = Depends(get_current_user)):
    uid = current_user['uid']
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    
    user_data = user_doc.to_dict() if user_doc.exists else {}
    
    credit_cost = 20 if req.image_data else 1
    if req.target_language == 'react': credit_cost = 0 
    if req.existing_html: credit_cost = 1 
        
    if user_data.get('credits', 0) < credit_cost:
        raise HTTPException(status_code=402, detail="Insufficient credits")
        
    if credit_cost > 0:
        user_ref.update({"credits": firestore.Increment(-credit_cost)})
        
    try:
        final_prompt = req.prompt
        if req.existing_html:
            final_prompt = f"Modify the following HTML based on this request: '{req.prompt}'.\n\nExisting HTML:\n{req.existing_html}"
        if req.is_punjabi_mode:
            final_prompt = f"Understand this Punjabi context and build the site: {req.prompt}"

        generated_code, model_used = await generate_with_fallback(
            prompt=final_prompt, 
            images=req.image_data, 
            target_lang=req.target_language or "html"
        )

        new_credits = user_ref.get().to_dict().get('credits', 0)

        return {
            "html": generated_code if req.target_language != "react" else None,
            "code": generated_code if req.target_language == "react" else None,
            "fallback_used": "glm" not in model_used.lower(),
            "credits_remaining": new_credits,
            "user_profile": get_user_profile(uid)
        }
    except Exception as e:
        if credit_cost > 0:
            user_ref.update({"credits": firestore.Increment(credit_cost)})
        raise HTTPException(status_code=500, detail=str(e))

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
    
    user_ref = db.collection("users").document(user_id)
    user_data = user_ref.get().to_dict()
    old_projects = user_data.get("projects", [])
    new_projects = [p for p in old_projects if str(p.get("timestamp")) != timestamp]
    if len(old_projects) != len(new_projects):
        user_ref.update({"projects": new_projects})
    return {"status": "success"}

@app.delete("/users/{user_id}/projects")
async def delete_all_projects_endpoint(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['uid'] != user_id: raise HTTPException(status_code=403, detail="Unauthorized")
        
    projects_ref = db.collection("users").document(user_id).collection("projects")
    for doc in projects_ref.stream():
        if doc.id != CHAT_HISTORY_PROJECT_NAME: doc.reference.delete()
            
    user_ref = db.collection("users").document(user_id)
    user_data = user_ref.get().to_dict()
    old_projects = user_data.get("projects", [])
    new_projects = [p for p in old_projects if p.get("name") == CHAT_HISTORY_PROJECT_NAME]
    user_ref.update({"projects": new_projects})
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
    except Exception as e:
        print(f"Warning: Firebase Storage upload failed: {e}")
        public_url = f"https://storage.sitee.in/uploads/{uid}/{file.filename}"
    
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get().to_dict() or {}
    current_mb = user_doc.get("storage_used_mb", 0.0)
    new_mb = current_mb + (file_size_bytes / (1024 * 1024))
    user_ref.update({"storage_used_mb": new_mb})
    
    return {"url": public_url, "user_profile": get_user_profile(uid)}

# --- Deployment & Publishing ---
@app.post("/users/{user_id}/projects/{timestamp}/publish")
async def publish_external_endpoint(user_id: str, timestamp: str, content: dict = Body(...), current_user: dict = Depends(get_current_user)):
    uid = current_user['uid']
    if uid != user_id: raise HTTPException(status_code=403, detail="Unauthorized")
        
    user_ref = db.collection('users').document(uid)
    user_doc = user_ref.get()
    
    if not user_doc.exists or user_doc.to_dict().get("subscriptionTier", "free") == "free":
        raise HTTPException(status_code=403, detail="Publishing is a premium feature.")
        
    if not VERCEL_TOKEN:
        raise HTTPException(status_code=500, detail="Server is not configured for Vercel publishing.")

    project_name = content.get("project_name", f"sitee-{uid.lower()[:8]}-{timestamp}")
    html_code = content.get("html_content", "")
    
    headers = {"Authorization": f"Bearer {VERCEL_TOKEN}"}
    if VERCEL_TEAM_ID: headers["x-vercel-team-id"] = VERCEL_TEAM_ID
    
    api_url = "https://api.vercel.com/v13/deployments"
    payload = {"name": project_name, "files": [{"file": "index.html", "data": html_code}]}

    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        deployment_url = f"https://{data['url']}"

        doc_ref = db.collection("users").document(uid).collection("projects").document(timestamp)
        if doc_ref.get().exists: doc_ref.update({"published_url": deployment_url})
        
        return {"url": deployment_url}
    except requests.exceptions.RequestException as e:
        error_details = e.response.json() if e.response else {}
        raise HTTPException(status_code=502, detail=f"Publishing service error: {error_details.get('error', {}).get('message')}")

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
    subdomain = req.get("subdomain")
    timestamp = str(req.get("project_timestamp"))
    
    published_url = f"https://{subdomain}-app.sitee.in"
    doc_ref = db.collection("users").document(uid).collection("projects").document(timestamp)
    if doc_ref.get().exists: doc_ref.update({"published_url": published_url})
    return {"url": published_url, "status": "success"}

@app.delete("/unpublish-sitee/{timestamp}")
async def unpublish_sitee_endpoint(timestamp: str, current_user: dict = Depends(get_current_user)):
    uid = current_user['uid']
    doc_ref = db.collection("users").document(uid).collection("projects").document(timestamp)
    if doc_ref.get().exists: doc_ref.update({"published_url": None})
    return {"status": "success"}

@app.post("/users/me/github-token")
async def save_github_token_endpoint(req: dict = Body(...), current_user: dict = Depends(get_current_user)):
    uid = current_user['uid']
    db.collection("users").document(uid).update({
        "github_token": req.get("github_token"),
        "github_token_expiry": str(firestore.SERVER_TIMESTAMP)
    })
    return {"status": "success"}

@app.delete("/users/me/github-token")
async def remove_github_token_endpoint(current_user: dict = Depends(get_current_user)):
    uid = current_user['uid']
    db.collection("users").document(uid).update({"github_token": None, "github_token_expiry": None})
    return {"status": "success"}

@app.post("/deploy-github")
async def deploy_github_endpoint(req: dict = Body(...), current_user: dict = Depends(get_current_user)):
    uid = current_user['uid']
    user_doc = db.collection("users").document(uid).get().to_dict()
    token = user_doc.get("github_token")
    if not token: raise HTTPException(status_code=401, detail="GitHub token missing or expired.")
        
    mock_url = f"https://github.com/your-username/{req.get('repo_name')}"
    return {"url": mock_url, "status": "success"}

@app.post("/suggest_improvements/")
async def suggest_improvements_endpoint(req: dict = Body(...), current_user: dict = Depends(get_current_user)):
    uid = current_user['uid']
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    
    current_credits = user_doc.to_dict().get("credits", 0)
    if current_credits < 1: raise HTTPException(status_code=403, detail="Insufficient credits for suggestions.")
    user_ref.update({"credits": firestore.Increment(-1)})

    mock_suggestions = [{
        "description": "Improve button contrast for better accessibility.",
        "selector": "button",
        "new_outer_html": "<button style='background-color: #3B82F6; color: white; padding: 10px 20px; border-radius: 8px; border: none;'>Improved Button</button>"
    }]
    
    return {"suggestions": mock_suggestions, "user_profile": get_user_profile(uid)}

@app.post("/apply-suggestion-fix/")
async def apply_suggestion_endpoint(req: dict = Body(...), current_user: dict = Depends(get_current_user)):
    return {"new_html": req.get("new_outer_html")}

@app.get("/{full_path:path}")
async def serve_sitee_subdomains(request: Request, full_path: str):
    """
    Catch-all route to serve published HTML based on the subdomain.
    This MUST be at the very bottom of your routes so it doesn't block /generate or /users.
    """
    host = request.headers.get("host", "").split(":")[0]

    if "onrender.com" in host or host == "127.0.0.1" or host == "localhost":
        return {"message": "Sitee API is running"}

    target_url = f"https://{host}"

    try:
        projects = db.collection_group("projects").where("published_url", "==", target_url).limit(1).stream()
        
        for proj in projects:
            proj_data = proj.to_dict()
            html_content = proj_data.get("html", "<h1>Empty Project</h1>")
            return HTMLResponse(content=html_content, status_code=200)
            
        return HTMLResponse(
            content=f"""
            <div style='font-family: sans-serif; text-align: center; margin-top: 50px;'>
                <h1>404 - Site Not Found</h1>
                <p>No project is published at <b>{target_url}</b></p>
                <a href='https://www.sitee.in' style='color: #3B82F6;'>Build your own at Sitee.in</a>
            </div>
            """, 
            status_code=404
        )

    except Exception as e:
        print(f"Subdomain Routing Error: {e}")
        return HTMLResponse(content="<h1>500 - Internal Server Error</h1>", status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
