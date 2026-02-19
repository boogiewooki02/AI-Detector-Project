# Is It AI

> 서비스 확인하기: [is-it-ai.site](https://is-it-ai.site)

**Is It AI**는 업로드된 이미지의 위·변조 여부를 분석하고, 히트맵(Heatmap) 시각화 결과와 함께 신뢰 지표(Confidence 및 다양한 정량 지표)를 제공하는 서비스입니다.

---

## Key Features

- **Analyzing**: 단일 이미지에 대한 분석 지표와 직관적인 히트맵 제공
- **User History**: JWT 기반 인증으로 사용자별 히스토리 관리 및 상세 조회/삭제
- **Analysis Metrics**: 단순 판별을 넘어 **Confidence, SSIM, LPIPS, RM, PVR** 등 지표 제공
- **Visual Feedback**: 원본 대비 **히트맵 이미지 제공**으로 위변조 의심 영역 시각화

---

## Main System Flow

서비스의 메인 기능인 분석 처리를 위해 다음 파이프라인으로 구성했습니다.

1. **Upload**  
   사용자가 업로드한 이미지를 Spring Boot가 수신한 뒤 AWS S3에 저장합니다.

2. **Inference**  
   Spring 서버가 S3 URL을 FastAPI로 전달하여 **추론 요청**을 수행합니다.

3. **Analysis**  
   FastAPI 서버에서 **모델 추론 및 히트맵 생성**을 수행하고, 결과 이미지를 S3에 업로드합니다.

4. **Persistence**  
   Spring 서버가 분석 결과(Confidence, SSIM 등)를 DB에 기록하고 클라이언트에 응답합니다.

---

## Service Architecture

![Service Architecture](docs/images/service-architecture.png)

- **Frontend**: Vercel에서 Next.js 애플리케이션을 정적 호스팅하며 자동 배포
- **Backend**: AWS EC2에서 Docker Compose로 Spring Boot와 FastAPI 추론 서버를 함께 운영
- **Reverse Proxy**: Nginx를 통해 HTTPS(SSL) 적용 후 프록시 라우팅 수행
- **Storage & DB**: AWS S3에 모델 가중치 및 이미지 파일 저장, MySQL에 사용자/분석 이력 저장

---

## Deployment & CI/CD

- Frontend: Vercel Git Hook 기반 자동 배포

- Backend: GitHub Actions로 Docker Image 빌드 후 EC2 자동 배포

---

## Service Screenshots

1. 이미지 분석 중

![Analyzing Screen](docs/images/analyzing.png)

2. 분석 결과

![Analysis Result Screen](docs/images/result.png)

3. 분석 이력

![Guideline Screen](docs/images/history.png)

---

## Tech Stack

| 영역 | 사용 기술 |
| --- | --- |
| Frontend | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=111827) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) |
| Backend | ![Java](https://img.shields.io/badge/Java_21-007396?style=flat-square&logo=openjdk&logoColor=white) ![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white) ![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=flat-square&logo=springsecurity&logoColor=white) ![JPA](https://img.shields.io/badge/JPA-59666C?style=flat-square&logo=hibernate&logoColor=white) |
| AI Server | ![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=flat-square&logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) ![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=flat-square&logo=pytorch&logoColor=white) ![Grad-CAM](https://img.shields.io/badge/Grad--CAM-111827?style=flat-square&logoColor=white) |
| Infra / DB | ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white) ![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white) ![AWS EC2](https://img.shields.io/badge/AWS_EC2-FF9900?style=flat-square&logo=amazonec2&logoColor=white) ![AWS RDS](https://img.shields.io/badge/AWS_RDS-527FFF?style=flat-square&logo=amazonrds&logoColor=white) ![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=flat-square&logo=amazons3&logoColor=white) ![AWS Route 53](https://img.shields.io/badge/AWS_Route_53-8C4FFF?style=flat-square&logo=amazonroute53&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white) |

---

## Project Structure

```text
.
├── .github/              # GitHub Actions 워크플로우
├── frontend-nextjs/      # 사용자 UI 및 API 통신
├── backend-spring/       # 비즈니스 로직 및 인증 처리
├── ai-server/            # AI 모델 추론 및 시각화 서버
└── docker-compose.yml    # 전체 서비스 컨테이너 오케스트레이션
```
