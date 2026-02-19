export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
}

export interface DetectionResponse {
  id: number;
  labelName: string;
  state: string;
  confidence: number | null;
  ssim: number | null;
  lpips: number | null;
  rm: number | null;
  pvr: number | null;
  originalImageUrl: string;
  heatmapImageUrl: string;
}

export interface UserMeResponse {
  email: string;
  name: string;
}

export interface UpdateUserRequest {
  name: string;
}

export interface UpdateUserResponse {
  email: string;
  name: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
