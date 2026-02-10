"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/nav-bar";
import { getDetectionDetail, getDetectionHistory } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { DetectionResponse } from "@/lib/types";

function formatScore(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toFixed(4);
}

export default function HistoryPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState<DetectionResponse[]>([]);
  const [selected, setSelected] = useState<DetectionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loggedIn = Boolean(getAccessToken());
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      void loadHistory();
    }
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    setErrorMessage("");
    try {
      const historyResponse = await getDetectionHistory();
      setHistory(historyResponse);
      if (historyResponse.length > 0) {
        setSelected(historyResponse[0]);
      }
    } catch {
      setErrorMessage("히스토리를 불러오지 못했습니다.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelect = async (requestId: number) => {
    setErrorMessage("");
    try {
      const detail = await getDetectionDetail(requestId);
      setSelected(detail);
    } catch {
      setErrorMessage("상세 결과를 불러오지 못했습니다.");
    }
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10">
        <section className="rounded-3xl border border-border bg-surface p-8 shadow-card">
          <h1 className="text-3xl font-black">My Analysis History</h1>
          <p className="mt-2 text-sm text-muted">
            로그인한 계정의 분석 이력과 상세 결과를 조회할 수 있습니다.
          </p>

          {!isLoggedIn && (
            <div className="mt-6 rounded-2xl border border-border bg-white p-5 text-sm">
              이 페이지는 로그인 후 사용할 수 있습니다.
              <div className="mt-4 flex gap-2">
                <Link
                  href="/login"
                  className="rounded-lg bg-primary px-4 py-2 font-semibold text-white"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg border border-border px-4 py-2 font-semibold"
                >
                  회원가입
                </Link>
              </div>
            </div>
          )}

          {isLoggedIn && (
            <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
              <aside className="rounded-2xl border border-border bg-white p-4">
                <button
                  type="button"
                  onClick={() => void loadHistory()}
                  disabled={loadingHistory}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  {loadingHistory ? "불러오는 중..." : "새로고침"}
                </button>
                <ul className="mt-4 space-y-2">
                  {history.length === 0 && (
                    <li className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">
                      저장된 분석 기록이 없습니다.
                    </li>
                  )}
                  {history.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => void handleSelect(item.id)}
                        className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:border-primary"
                      >
                        <span>#{item.id}</span>
                        <span className="text-muted">{item.labelName}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>

              <article className="rounded-2xl border border-border bg-white p-5">
                {!selected && (
                  <p className="text-sm text-muted">
                    왼쪽 목록에서 분석 이력을 선택하면 상세 결과가 표시됩니다.
                  </p>
                )}
                {selected && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold">Request #{selected.id}</h2>
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                        {selected.state}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="text-muted">label</dt>
                      <dd className="font-medium">{selected.labelName}</dd>
                      <dt className="text-muted">confidence</dt>
                      <dd>{formatScore(selected.confidence)}</dd>
                      <dt className="text-muted">ssim</dt>
                      <dd>{formatScore(selected.ssim)}</dd>
                      <dt className="text-muted">lpips</dt>
                      <dd>{formatScore(selected.lpips)}</dd>
                      <dt className="text-muted">rm</dt>
                      <dd>{formatScore(selected.rm)}</dd>
                      <dt className="text-muted">pvr</dt>
                      <dd>{formatScore(selected.pvr)}</dd>
                    </dl>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                          Original
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selected.originalImageUrl}
                          alt="Original"
                          className="h-64 w-full rounded-xl border border-border bg-slate-100 object-contain"
                        />
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                          Heatmap
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selected.heatmapImageUrl}
                          alt="Heatmap"
                          className="h-64 w-full rounded-xl border border-border bg-slate-100 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {errorMessage && <p className="mt-4 text-sm text-danger">{errorMessage}</p>}
              </article>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
