"use client";

import NavBar from "@/components/nav-bar";
import { getAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MyPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [name, setName] = useState("홍길동");
  const [email, setEmail] = useState("user@example.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loggedIn = Boolean(getAccessToken());
    if (!loggedIn) {
      router.replace("/login");
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: API 연동 (PATCH /users/me)
    setNotice("회원 정보 수정 API 연동 전입니다.");
  };

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword !== newPasswordConfirm) {
      setNotice("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    // TODO: API 연동 (PATCH /users/me/password)
    setNotice("비밀번호 변경 API 연동 전입니다.");
  };

  const handleDeleteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (deleteConfirmText !== "회원탈퇴") {
      setNotice("'회원탈퇴'를 정확히 입력해주세요.");
      return;
    }
    // TODO: API 연동 (DELETE /users/me)
    setNotice("회원 탈퇴 API 연동 전입니다.");
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10">
        {checkingAuth ? null : (
          <div className="space-y-6">
            <section className="rounded-3xl border border-border bg-surface p-8 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Account Settings
              </p>
              <h1 className="mt-2 text-3xl font-black">My Page</h1>
              <p className="mt-3 text-sm text-muted">
                계정 정보를 관리하고 비밀번호를 변경할 수 있습니다.
              </p>
              {notice && (
                <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-primary">
                  {notice}
                </p>
              )}
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                <h2 className="text-xl font-black">회원 정보 수정</h2>
                <p className="mt-2 text-sm text-muted">
                  이름과 이메일을 수정할 수 있습니다.
                </p>

                <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="name" className="text-sm font-medium">
                      이름
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
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
                      className="w-full rounded-lg border border-border bg-white px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full cursor-pointer rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition hover:bg-primary-dark"
                  >
                    저장하기
                  </button>
                </form>
              </article>

              <article className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                <h2 className="text-xl font-black">비밀번호 변경</h2>
                <p className="mt-2 text-sm text-muted">
                  보안을 위해 현재 비밀번호를 먼저 입력해주세요.
                </p>

                <form
                  onSubmit={handlePasswordSubmit}
                  className="mt-5 space-y-4"
                >
                  <div className="space-y-1">
                    <label
                      htmlFor="currentPassword"
                      className="text-sm font-medium"
                    >
                      현재 비밀번호
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-white px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="newPassword"
                      className="text-sm font-medium"
                    >
                      새 비밀번호
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="newPasswordConfirm"
                      className="text-sm font-medium"
                    >
                      새 비밀번호 확인
                    </label>
                    <input
                      id="newPasswordConfirm"
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(event) =>
                        setNewPasswordConfirm(event.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-white px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full cursor-pointer rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition hover:bg-primary-dark"
                  >
                    비밀번호 변경
                  </button>
                </form>
              </article>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-danger">
                    Danger Zone
                  </p>
                  <h2 className="mt-1 text-xl font-black">회원 탈퇴</h2>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <p className="text-sm font-semibold">
                    탈퇴 전에 확인해주세요.
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-muted">
                    <li>계정 정보 및 로그인 권한이 삭제됩니다.</li>
                    <li>분석 이력 및 관련 데이터가 함께 삭제될 수 있습니다.</li>
                    <li>
                      같은 이메일로 재가입해도 기존 데이터는 복구되지 않습니다.
                    </li>
                  </ul>
                </div>

                <form
                  onSubmit={handleDeleteSubmit}
                  className="rounded-xl border border-red-200 bg-red-50/60 p-4"
                >
                  <label
                    htmlFor="deleteConfirmText"
                    className="text-sm font-semibold text-danger"
                  >
                    확인 문구 입력
                  </label>
                  <p className="mt-1 text-xs text-danger/90">
                    계속하려면 <span className="font-bold">회원탈퇴</span>를
                    입력하세요.
                  </p>
                  <input
                    id="deleteConfirmText"
                    type="text"
                    value={deleteConfirmText}
                    onChange={(event) =>
                      setDeleteConfirmText(event.target.value)
                    }
                    className="mt-3 w-full rounded-lg border border-red-300 bg-white px-3 py-2.5 outline-none transition focus:border-danger focus:ring-2 focus:ring-red-200"
                    required
                  />
                  <button
                    type="submit"
                    className="mt-3 w-full cursor-pointer rounded-lg bg-danger px-4 py-2.5 font-semibold text-white transition hover:opacity-90"
                  >
                    회원 탈퇴
                  </button>
                </form>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
