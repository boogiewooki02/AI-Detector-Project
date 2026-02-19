"use client";

import NavBar from "@/components/nav-bar";
import { login } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const tokenResponse = await login({ email, password });
      setAccessToken(tokenResponse.accessToken);
      router.push("/history");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message ?? "로그인에 실패했습니다.",
        );
      } else {
        setErrorMessage("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-6xl items-center justify-center px-5 py-10">
        <section className="w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
          <div className="grid lg:grid-cols-[1.05fr_1fr]">
            <aside className="border-b border-border bg-slate-50 p-8 lg:border-b-0 lg:border-r lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Account Access
              </p>
              <h1 className="mt-3 text-4xl font-black leading-tight">
                로그인하고
                <br />
                분석 이력을 관리하세요
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted">
                계정 로그인 후 분석 기록 조회, 결과 비교, 재분석 작업을 한
                곳에서 관리할 수 있습니다.
              </p>
              <ul className="mt-8 space-y-3 text-sm">
                <li className="rounded-lg border border-border bg-white px-4 py-3">
                  최근 분석 히스토리 빠른 조회
                </li>
                <li className="rounded-lg border border-border bg-white px-4 py-3">
                  요청 ID 기반 상세 결과 확인
                </li>
                <li className="rounded-lg border border-border bg-white px-4 py-3">
                  원본/히트맵 이미지 비교 분석
                </li>
              </ul>
            </aside>

            <article className="p-8 lg:p-10">
              <h2 className="text-2xl font-black">Log in</h2>
              <p className="mt-2 text-sm text-muted">
                등록된 이메일과 비밀번호를 입력해주세요.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="email" className="text-sm font-medium">
                    이메일
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="password" className="text-sm font-medium">
                    비밀번호
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {errorMessage && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
                    {errorMessage}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
                >
                  {loading ? "로그인 중..." : "로그인"}
                </button>
              </form>

              <div className="mt-5 rounded-lg border border-border bg-slate-50 px-4 py-3 text-sm text-muted">
                아직 계정이 없나요?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-primary hover:underline"
                >
                  회원가입
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
