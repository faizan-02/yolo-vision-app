import os
import uuid
import asyncio
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
import shutil

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import torch

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "model.pt"
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

model = None
executor = ThreadPoolExecutor(max_workers=2)
video_jobs = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    import pathlib
    import platform
    
    # Fix for loading cross-platform PyTorch models
    # If running on Linux but loading a Windows-saved model, map WindowsPath to PosixPath
    if platform.system() == 'Linux':
        pathlib.WindowsPath = pathlib.PosixPath
    else:
        pathlib.PosixPath = pathlib.WindowsPath
    
    try:
        model = torch.hub.load('ultralytics/yolov5', 'custom', path=str(MODEL_PATH), trust_repo=True)
    except TypeError:
        model = torch.hub.load('ultralytics/yolov5', 'custom', path=str(MODEL_PATH))
    
    yield
    executor.shutdown(wait=False)

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

FRONTEND_DIR = BASE_DIR / "frontend" / "out"

@app.post("/api/detect/image")
async def detect_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    results = model(img)
    annotated = results.render()[0]
    
    out_name = f"res_{uuid.uuid4().hex[:8]}.jpg"
    out_path = UPLOADS_DIR / out_name
    cv2.imwrite(str(out_path), annotated)
    
    return {
        "status": "success",
        "annotated_image": f"/api/files/{out_name}",
        "detections": len(results.xyxy[0])
    }

def _process_video(job_id, in_path, out_path):
    try:
        cap = cv2.VideoCapture(in_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        raw_out = UPLOADS_DIR / f"raw_{job_id}.mp4"
        out = cv2.VideoWriter(str(raw_out), cv2.VideoWriter_fourcc(*'mp4v'), fps, (w, h))
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            res = model(frame)
            out.write(res.render()[0])
            
        cap.release()
        out.release()
        
        os.system(f'ffmpeg -y -i "{raw_out}" -vcodec libx264 "{out_path}"')
        os.remove(str(raw_out))
        
        video_jobs[job_id]["status"] = "done"
        video_jobs[job_id]["output"] = f"/api/files/{job_id}.mp4"
    except Exception as e:
        video_jobs[job_id]["status"] = "error"
        video_jobs[job_id]["error"] = str(e)

@app.post("/api/detect/video")
async def detect_video(file: UploadFile = File(...)):
    job_id = uuid.uuid4().hex[:8]
    in_name = f"in_{job_id}{Path(file.filename).suffix or '.mp4'}"
    in_path = UPLOADS_DIR / in_name
    
    with open(in_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
    video_jobs[job_id] = {"status": "processing"}
    out_path = UPLOADS_DIR / f"{job_id}.mp4"
    
    asyncio.get_event_loop().run_in_executor(executor, _process_video, job_id, str(in_path), str(out_path))
    return {"job_id": job_id, "status": "processing"}

@app.get("/api/detect/video/{job_id}")
async def get_video_status(job_id: str):
    job = video_jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job

@app.get("/api/files/{filename}")
async def get_file(filename: str):
    filepath = UPLOADS_DIR / filename
    if not filepath.exists():
        raise HTTPException(404, "File not found")
    media_type = "video/mp4" if filename.endswith(".mp4") else "image/jpeg"
    return FileResponse(str(filepath), media_type=media_type)

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if not full_path or full_path == "/":
        full_path = "index.html"
    
    headers = {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
    }
    
    path = FRONTEND_DIR / full_path
    
    if path.exists() and path.is_file():
        return FileResponse(str(path), headers=headers)
    
    html_path = FRONTEND_DIR / f"{full_path}.html"
    if html_path.exists() and html_path.is_file():
        return FileResponse(str(html_path), headers=headers)
        
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists() and index_path.is_file():
        return FileResponse(str(index_path), headers=headers)
        
    raise HTTPException(404, "Not found")
