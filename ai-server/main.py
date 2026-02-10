from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from inference import SwinInference
import io
import os
from PIL import Image
import requests
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageUrlRequest(BaseModel):
    image_url: str

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
async def predict(request: ImageUrlRequest):
    try:
        # S3 URL로 이미지 다운로드
        image_url = request.image_url
        response = requests.get(image_url)

        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="이미지를 불러올 수 없습니다.")
        
        image = Image.open(io.BytesIO(response.content)).convert("RGB")

        filename = image_url.split("/")[-1]

        results = engine.predict(image, filename)
        
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