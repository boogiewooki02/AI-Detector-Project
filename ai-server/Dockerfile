# 3.10 대신 3.12 사용
FROM python:3.12-slim

WORKDIR /app

# 시스템 의존성 업데이트 및 pip 업그레이드 (선택 사항이나 권장)
RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]