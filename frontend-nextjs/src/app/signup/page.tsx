"use client";

import NavBar from "@/components/nav-bar";
import { signup } from "@/lib/api";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      await signup({ email, password, name });
      router.push("/login");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message ?? "회원가입에 실패했습니다.",
        );
      } else {
        setErrorMessage("회원가입 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <section className="rounded-xl border border-border bg-surface p-6">
          <h1 className="text-2xl font-bold">회원가입</h1>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium">
                이름
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
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
                className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40"
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
                className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            {errorMessage && (
              <p className="text-sm text-danger">{errorMessage}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {loading ? "회원가입 중..." : "회원가입"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
