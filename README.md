# AI 생성 이미지 탐지 프로젝트

1인 토이 프로젝트를 통해 Next.js, Spring, FastAPI로 구성된 개별 시스템 간의 연동과 전반적인 아키텍처 설계를 직접 수행하고자 합니다. 전체적인 시스템 구조를 설계하고 구현하는 경험을 통해, 각 레이어별 역할과 데이터 흐름에 대한 학습을 깊이있게 진행하고자 합니다.

## Project Goals
- **전체 흐름 직접 구현:** 프론트, 백엔드, AI 서버를 직접 만들며 데이터가 처음부터 끝까지 어떻게 흐르는지 확실히 이해하는 것이 목표입니다.

- **주도적인 설계 경험:** 팀 프로젝트에서 정해진 역할만 수행하는 것에서 벗어나, 기술 선택부터 아키텍처 설계까지 모든 과정을 직접 결정하고 책임져 봅니다.

- **문제 해결 능력:** 서버 간 통신이나 인프라 설정 등 개발 과정에서 마주치는 크고 작은 문제들을 스스로 끝까지 해결해 보며 실무 역량을 기릅니다.

## Tech Stack

### Backend & AI
- **Java 17** / **Spring Boot 3.5.9**
- **Python 3.12** / **FastAPI**
- **PostgreSQL**

### Frontend
- **Next.js 14**
- **Tailwind CSS**

### Infrastructure
- **Docker**
- **AWS S3**

## Project Structure
```text
.
├── backend-spring/     # Spring 기반 메인 서버 코드
├── ai-server-python/   # FastAPI 기반 AI 서버 코드
├── frontend-nextjs/    # Next.js 기반 프론트엔드 코드
└── infra/              # Docker 및 DB 설정 파일
```
