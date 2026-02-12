from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from inference import SwinInference
import io
import os
from pathlib import Path
from PIL import Image
import requests
from pydantic import BaseModel
import boto3
from uuid import uuid4

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageUrlRequest(BaseModel):
    image_url: str

# Runtime config
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")
MODEL_NAME = "swinv2_small_window16_256"
MODEL_PATH_FALLBACK = os.getenv("MODEL_PATH", "./models/sota.pth")
LOCAL_MODEL_PATH = os.getenv("LOCAL_MODEL_PATH", "/app/weights/model.pth")
S3_MODEL_KEY = os.getenv("S3_MODEL_KEY")
IMAGE_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
MODEL_BUCKET_NAME = os.getenv("S3_MODEL_BUCKET_NAME", IMAGE_BUCKET_NAME)


def create_s3_client():
    region = os.getenv("AWS_REGION", "ap-northeast-2")
    access_key = os.getenv("AWS_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY") or os.getenv("AWS_SECRET_KEY")

    # 키가 있으면 키로 접속, 없으면 IAM Role을 자동으로 사용하도록 설정
    if access_key and secret_key:
        return boto3.client(
            "s3",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region
        )
    return boto3.client("s3", region_name=region)


def resolve_model_path() -> str:
    # If model S3 key is absent, keep local fallback for compatibility.
    if not S3_MODEL_KEY:
        return MODEL_PATH_FALLBACK

    if not MODEL_BUCKET_NAME:
        raise RuntimeError("S3_MODEL_KEY is set but S3_MODEL_BUCKET_NAME/S3_BUCKET_NAME is missing.")

    local_path = Path(LOCAL_MODEL_PATH)
    local_path.parent.mkdir(parents=True, exist_ok=True)

    force_download = os.getenv("MODEL_DOWNLOAD_ALWAYS", "false").lower() == "true"
    if local_path.exists() and not force_download:
        return str(local_path)

    s3_client = create_s3_client()
    print(f"[Model] Downloading s3://{MODEL_BUCKET_NAME}/{S3_MODEL_KEY} -> {local_path}")
    s3_client.download_file(MODEL_BUCKET_NAME, S3_MODEL_KEY, str(local_path))
    return str(local_path)

# 서비스 객체 생성
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

MODEL_PATH = resolve_model_path()
engine = SwinInference(MODEL_PATH, MODEL_NAME, UPLOAD_DIR)

RISK_TABLE = {
    0: {"name": "Real (원본)", "state": "Real"},
    1: {"name": "Sleek Fake (눈속임형)", "state": "Low Risk"},
    2: {"name": "Noisy Fake (노이즈형)", "state": "Mid Risk"},
    3: {"name": "Failure (망가짐)", "state": "High Risk"},
}

s3_client = create_s3_client()


@app.get("/")
def health_check():
    return {"status": "AI Server is Running"}

@app.post("/predict")
async def predict(request: ImageUrlRequest):
    try:
        # S3 URL로 이미지 다운로드
        image_url = request.image_url
        response = requests.get(image_url, timeout=15)

        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="이미지를 불러올 수 없습니다.")
        
        image = Image.open(io.BytesIO(response.content)).convert("RGB")

        filename = image_url.split("/")[-1]

        results = engine.predict(image, filename)

        local_heatmap_path = os.path.join(UPLOAD_DIR, results["heatmap_filename"])
        s3_heatmap_name = f"heatmap_{uuid4()}.png"

        if not IMAGE_BUCKET_NAME:
            raise HTTPException(status_code=500, detail="S3_BUCKET_NAME이 설정되지 않았습니다.")

        s3_client.upload_file(
            local_heatmap_path,
            IMAGE_BUCKET_NAME,
            s3_heatmap_name,
            ExtraArgs={'ContentType': 'image/png'}
        )

        heatmap_url = f"https://{IMAGE_BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com/{s3_heatmap_name}"
        
        # 3. 결과 구성
        info = RISK_TABLE[results["label"]]
        return {
            "label": results["label"],
            "labelName": info["name"],
            "state": info["state"],
            "confidence": round(results["confidence"], 4),
            "heatmapUrl": heatmap_url,
            "ssim": round(results["ssim"], 4),
            "lpips": round(results["lpips"], 4),
            "rm": round(results["rm"], 6),
            "pvr": round(results["pvr"], 2),
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
