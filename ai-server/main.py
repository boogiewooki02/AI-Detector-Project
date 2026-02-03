from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from inference import SwinInference
import io
from PIL import Image
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 설정 (Docker 볼륨 경로와 일치해야 함)
UPLOAD_DIR = "/app/uploads"
MODEL_PATH = "./models/sota.pth"
MODEL_NAME = "swinv2_small_window16_256"

# 서비스 객체 생성
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

engine = SwinInference(MODEL_PATH, MODEL_NAME, UPLOAD_DIR)

RISK_TABLE = {
    0: {"name": "Real (원본)", "state": "Real"},
    1: {"name": "Sleek Fake (눈속임형)", "state": "Low Risk"},
    2: {"name": "Noisy Fake (노이즈형)", "state": "Mid Risk"},
    3: {"name": "Failure (망가짐)", "state": "High Risk"},
}

@app.get("/")
def health_check():
    return {"status": "AI Server is Running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # 1. 이미지 읽기
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        # 2. 모델 추론
        results = engine.predict(image, file.filename)
        
        # 3. 결과 구성
        info = RISK_TABLE[results["label"]]
        return {
            "label": results["label"],
            "labelName": info["name"],
            "state": info["state"],
            "confidence": round(results["confidence"], 4),
            "ssim": round(results["ssim"], 4),
            "lpips": round(results["lpips"], 4),
            "rm": round(results["rm"], 6),
            "pvr": round(results["pvr"], 2),
            "heatmapFilename": results["heatmap_filename"]
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))