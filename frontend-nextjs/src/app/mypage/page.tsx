"use client";

import NavBar from "@/components/nav-bar";
import { getMyInfo, updateMyInfo, updateMyPassword, withdraw } from "@/lib/api";
import { getAccessToken, removeAccessToken } from "@/lib/auth";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function MyPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [name, setName] = useState("홍길동");
  const [email, setEmail] = useState("user@example.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [withdrawNotice, setWithdrawNotice] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const hasPasswordConfirmInput = useMemo(
    () => newPasswordConfirm.length > 0,
    [newPasswordConfirm],
  );
  const isPasswordMatch = useMemo(
    () => newPassword.length > 0 && newPassword === newPasswordConfirm,
    [newPassword, newPasswordConfirm],
  );

  const extractErrorMessage = (
    error: unknown,
    fallbackMessage: string,
  ): string => {
    if (!axios.isAxiosError(error)) return fallbackMessage;

    const data = error.response?.data;
    if (typeof data === "string" && data.trim().length > 0) {
      return data;
    }

    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      if (typeof record.message === "string" && record.message.trim().length > 0) {
        return record.message;
      }
      if (typeof record.error === "string" && record.error.trim().length > 0) {
        return record.error;
      }
    }

    return fallbackMessage;
  };

  useEffect(() => {
    const loggedIn = Boolean(getAccessToken());
    if (!loggedIn) {
      router.replace("/login");
      return;
    }

    const loadMyInfo = async () => {
      try {
        const myInfo = await getMyInfo();
        setName(myInfo.name ?? "");
        setEmail(myInfo.email ?? "");
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          removeAccessToken();
          router.replace("/login");
          return;
        }
        setPageNotice("회원 정보를 불러오지 못했습니다.");
      } finally {
        setCheckingAuth(false);
      }
    };

    void loadMyInfo();
  }, [router]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileNotice("");
    setWithdrawNotice("");
    setProfileLoading(true);

    try {
      const updatedUser = await updateMyInfo({ name });
      setName(updatedUser.name ?? "");
      setEmail(updatedUser.email ?? "");
      setProfileNotice("회원 정보가 수정되었습니다.");
    } catch (error) {
      setProfileNotice(extractErrorMessage(error, "회원 정보 수정에 실패했습니다."));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileNotice("");
    setCurrentPasswordError("");
    setNewPasswordError("");
    setWithdrawNotice("");

    if (newPassword !== newPasswordConfirm) {
      return;
    }

    if (currentPassword === newPassword) {
      setNewPasswordError("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
      return;
    }

    setPasswordLoading(true);
    try {
      await updateMyPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setToastMessage("비밀번호가 변경되었습니다.");
    } catch (error) {
      const errorMessage = extractErrorMessage(error, "비밀번호 변경에 실패했습니다.");
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const looksLikeCurrentPasswordError =
        errorMessage.includes("현재 비밀번호") ||
        errorMessage.includes("비밀번호가 일치하지 않습니다.");

      const looksLikeNewPasswordError =
        errorMessage.includes("새 비밀번호는 현재 비밀번호와 달라야 합니다.") ||
        errorMessage.includes("새 비밀번호") ||
        status === 401 ||
        status === 403;

      if (looksLikeCurrentPasswordError) {
        setCurrentPasswordError("현재 비밀번호가 일치하지 않습니다.");
        return;
      }

      if (looksLikeNewPasswordError) {
        setNewPasswordError("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        return;
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileNotice("");
    setWithdrawNotice("");

    if (deleteConfirmText !== "회원탈퇴") {
      setWithdrawNotice("'회원탈퇴'를 정확히 입력해주세요.");
      return;
    }

    setWithdrawLoading(true);
    try {
      await withdraw();
      removeAccessToken();
      router.push("/");
      router.refresh();
    } catch (error) {
      setWithdrawNotice(extractErrorMessage(error, "회원 탈퇴에 실패했습니다."));
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[70] w-full max-w-md -translate-x-1/2 px-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg shadow-emerald-100/60">
            {toastMessage}
          </div>
        </div>
      )}
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
              {pageNotice && (
                <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-primary">
                  {pageNotice}
                </p>
              )}
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                <h2 className="text-xl font-black">회원 정보 수정</h2>
                <p className="mt-2 text-sm text-muted">
                  이름을 수정할 수 있습니다.
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
                      readOnly
                      disabled
                      className="w-full cursor-not-allowed rounded-lg border border-border bg-slate-100 px-3 py-2.5 text-muted outline-none"
                    />
                    <p className="text-xs text-muted">
                      이메일 변경은 현재 지원하지 않습니다.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="w-full cursor-pointer rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
                  >
                    {profileLoading ? "저장 중..." : "저장하기"}
                  </button>
                  {profileNotice && (
                    <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-primary">
                      {profileNotice}
                    </p>
                  )}
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
                      onChange={(event) => {
                        setCurrentPassword(event.target.value);
                        setCurrentPasswordError("");
                        setNewPasswordError("");
                      }}
                      className={`w-full rounded-lg bg-white px-3 py-2.5 outline-none transition focus:ring-2 ${
                        currentPasswordError
                          ? "border border-red-300 focus:border-danger focus:ring-red-200"
                          : "border border-border focus:border-primary focus:ring-primary/20"
                      }`}
                      required
                    />
                    {currentPasswordError && (
                      <p className="text-xs font-medium text-danger">
                        {currentPasswordError}
                      </p>
                    )}
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
                      onChange={(event) => {
                        setNewPassword(event.target.value);
                        setNewPasswordError("");
                      }}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                    {newPasswordError && (
                      <p className="text-xs font-medium text-danger">{newPasswordError}</p>
                    )}
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
                    {hasPasswordConfirmInput && (
                      <p
                        className={`text-xs font-medium ${
                          isPasswordMatch ? "text-emerald-600" : "text-danger"
                        }`}
                      >
                        {isPasswordMatch
                          ? "새 비밀번호가 일치합니다."
                          : "새 비밀번호가 일치하지 않습니다."}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={passwordLoading || !isPasswordMatch}
                    className="w-full cursor-pointer rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
                  >
                    {passwordLoading ? "변경 중..." : "비밀번호 변경"}
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
                    disabled={withdrawLoading}
                    className="mt-3 w-full cursor-pointer rounded-lg bg-danger px-4 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {withdrawLoading ? "처리 중..." : "회원 탈퇴"}
                  </button>
                  {withdrawNotice && (
                    <p className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-danger">
                      {withdrawNotice}
                    </p>
                  )}
                </form>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
