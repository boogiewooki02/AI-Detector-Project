"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/nav-bar";
import {
  deleteDetectionHistory,
  getDetectionDetail,
  getDetectionHistory,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { DetectionResponse } from "@/lib/types";

function formatScore(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toFixed(4);
}

function getStateTone(state: string) {
  const normalized = state.toLowerCase();
  if (normalized.includes("real")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (normalized.includes("fail")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-sky-50 text-sky-700 border-sky-200";
}

export default function HistoryPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [history, setHistory] = useState<DetectionResponse[]>([]);
  const [selected, setSelected] = useState<DetectionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loggedIn = Boolean(getAccessToken());
    if (!loggedIn) {
      router.replace("/login");
      return;
    }
    void loadHistory();
    setCheckingAuth(false);
  }, [router]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    setErrorMessage("");
    try {
      const historyResponse = await getDetectionHistory();
      setHistory(historyResponse);
      setSelected((prev) => {
        if (!prev) return historyResponse[0] ?? null;
        const exists = historyResponse.find((item) => item.id === prev.id);
        return exists ?? historyResponse[0] ?? null;
      });
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

  const handleDelete = async (requestId: number) => {
    if (deletingId !== null) return;
    if (!window.confirm("해당 분석 이력을 삭제하시겠습니까?")) return;

    setErrorMessage("");
    setDeletingId(requestId);

    try {
      await deleteDetectionHistory(requestId);

      const updatedHistory = history.filter((item) => item.id !== requestId);
      setHistory(updatedHistory);

      if (selected?.id === requestId) {
        setSelected(updatedHistory[0] ?? null);
      }
    } catch {
      setErrorMessage("이력 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const selectedStateTone = useMemo(() => {
    if (!selected) return "bg-sky-50 text-sky-700 border-sky-200";
    return getStateTone(selected.state);
  }, [selected]);

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10">
        {checkingAuth ? null : (
          <section className="rounded-3xl border border-border bg-surface p-8 shadow-card">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Personal Archive
                </p>
                <h1 className="mt-2 text-3xl font-black">My Analysis History</h1>
                <p className="mt-2 text-sm text-muted">
                  요청별 분석 결과를 선택해 상세 리포트를 확인하고 관리하세요.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-slate-50 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-wider text-muted">Total Records</p>
                <p className="text-2xl font-black">{history.length}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
              <aside className="rounded-2xl border border-border bg-white p-4 lg:flex lg:max-h-[calc(100vh-240px)] lg:flex-col">
                <button
                  type="button"
                  onClick={() => void loadHistory()}
                  disabled={loadingHistory}
                  className="w-full cursor-pointer rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
                >
                  {loadingHistory ? "불러오는 중..." : "새로고침"}
                </button>

                <ul className="mt-4 space-y-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
                  {history.length === 0 && (
                    <li className="rounded-lg border border-dashed border-border bg-slate-50 p-4 text-sm text-muted">
                      저장된 분석 기록이 없습니다.
                    </li>
                  )}

                  {history.map((item) => {
                    const isActive = selected?.id === item.id;
                    return (
                      <li key={item.id}>
                        <div
                          className={`rounded-xl border px-3 py-3 transition ${
                            isActive
                              ? "border-primary/40 bg-blue-50/40"
                              : "border-border bg-white"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => void handleSelect(item.id)}
                            className="w-full cursor-pointer text-left"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold">분석 결과</span>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStateTone(item.state)}`}
                              >
                                {item.state}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-sm text-muted">{item.labelName}</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="mt-3 w-full cursor-pointer rounded-md border border-border px-2 py-1.5 text-xs font-semibold text-muted hover:bg-slate-50 disabled:opacity-50"
                          >
                            {deletingId === item.id ? "삭제 중..." : "이력 삭제"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              <article className="rounded-2xl border border-border bg-white p-6">
                {!selected && (
                  <div className="rounded-xl border border-dashed border-border bg-slate-50 p-6 text-sm text-muted">
                    왼쪽 목록에서 분석 이력을 선택하면 상세 리포트가 표시됩니다.
                  </div>
                )}

                {selected && (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted">Report</p>
                        <h2 className="text-2xl font-black">Analysis Detail</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${selectedStateTone}`}
                        >
                          {selected.state}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleDelete(selected.id)}
                          disabled={deletingId === selected.id}
                          className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-slate-50 disabled:opacity-50"
                        >
                          {deletingId === selected.id ? "삭제 중..." : "삭제"}
                        </button>
                      </div>
                    </div>

                    <dl className="grid gap-3 rounded-xl border border-border bg-slate-50 p-4 text-sm md:grid-cols-2">
                      <div className="rounded-lg bg-white px-3 py-2">
                        <dt className="text-xs uppercase tracking-wider text-muted">Label</dt>
                        <dd className="mt-1 font-semibold">{selected.labelName}</dd>
                      </div>
                      <div className="rounded-lg bg-white px-3 py-2">
                        <dt className="text-xs uppercase tracking-wider text-muted">Confidence</dt>
                        <dd className="mt-1 font-semibold">{formatScore(selected.confidence)}</dd>
                      </div>
                      <div className="rounded-lg bg-white px-3 py-2">
                        <dt className="text-xs uppercase tracking-wider text-muted">SSIM</dt>
                        <dd className="mt-1 font-semibold">{formatScore(selected.ssim)}</dd>
                      </div>
                      <div className="rounded-lg bg-white px-3 py-2">
                        <dt className="text-xs uppercase tracking-wider text-muted">LPIPS</dt>
                        <dd className="mt-1 font-semibold">{formatScore(selected.lpips)}</dd>
                      </div>
                      <div className="rounded-lg bg-white px-3 py-2">
                        <dt className="text-xs uppercase tracking-wider text-muted">RM</dt>
                        <dd className="mt-1 font-semibold">{formatScore(selected.rm)}</dd>
                      </div>
                      <div className="rounded-lg bg-white px-3 py-2">
                        <dt className="text-xs uppercase tracking-wider text-muted">PVR</dt>
                        <dd className="mt-1 font-semibold">{formatScore(selected.pvr)}</dd>
                      </div>
                    </dl>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-border bg-slate-50 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                          Original
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selected.originalImageUrl}
                          alt="Original"
                          className="h-72 w-full rounded-lg border border-border bg-white object-contain"
                        />
                      </div>
                      <div className="rounded-xl border border-border bg-slate-50 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                          Heatmap
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selected.heatmapImageUrl}
                          alt="Heatmap"
                          className="h-72 w-full rounded-lg border border-border bg-white object-contain"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
                    {errorMessage}
                  </p>
                )}
              </article>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
