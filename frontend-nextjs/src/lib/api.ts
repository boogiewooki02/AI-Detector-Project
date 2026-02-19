import axios from "axios";
import { getAccessToken } from "@/lib/auth";
import type {
  DetectionResponse,
  LoginRequest,
  SignupRequest,
  TokenResponse,
  UpdatePasswordRequest,
  UpdateUserRequest,
  UpdateUserResponse,
  UserMeResponse,
} from "@/lib/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function signup(data: SignupRequest) {
  const response = await api.post<number>("/api/v1/user/signup", data);
  return response.data;
}

export async function login(data: LoginRequest) {
  const response = await api.post<TokenResponse>("/api/v1/user/login", data);
  return response.data;
}

export async function uploadDetectionImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<DetectionResponse>(
    "/api/v1/detection/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function getDetectionHistory() {
  const response = await api.get<DetectionResponse[]>("/api/v1/detection/history");
  return response.data;
}

export async function getDetectionDetail(requestId: number) {
  const response = await api.get<DetectionResponse>(`/api/v1/detection/${requestId}`);
  return response.data;
}

export async function deleteDetectionHistory(requestId: number) {
  await api.delete(`/api/v1/detection/history/${requestId}`);
}

export async function getMyInfo() {
  const response = await api.get<UserMeResponse>("/api/v1/user/me");
  return response.data;
}

export async function updateMyInfo(data: UpdateUserRequest) {
  const response = await api.patch<UpdateUserResponse>("/api/v1/user/me", data);
  return response.data;
}

export async function updateMyPassword(data: UpdatePasswordRequest) {
  await api.patch("/api/v1/user/me/password", data);
}

export async function withdraw() {
  await api.delete("/api/v1/user/me");
}
