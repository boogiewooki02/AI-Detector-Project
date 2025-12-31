# fastapi 기본 코드 형식

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 프런트엔드나 스프링 서버에서 직접 호출할 경우를 대비한 CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "AI Server is Running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # 나중에 여기에 AI 모델 추론 로직이 들어갑니다.
    # 지금은 파일 이름과 가짜 결과만 반환합니다.
    return {
        "filename": file.filename,
        "is_ai_generated": True,
        "confidence": 0.98
    }