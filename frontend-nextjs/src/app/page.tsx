"use client";

import NavBar from "@/components/nav-bar";
import { uploadDetectionImage } from "@/lib/api";
import type { DetectionResponse } from "@/lib/types";
import axios from "axios";
import { useMemo, useRef, useState } from "react";

function formatScore(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toFixed(4);
}

const faqItems = [
  {
    question: "판별 결과가 100% 정확한가요?",
    answer:
      "아니요. 모델은 확률 기반 참고 지표입니다. 고위험 콘텐츠는 출처 검증과 메타데이터 확인을 병행하세요.",
  },
  {
    question: "업로드한 이미지는 어디에 저장되나요?",
    answer:
      "업로드 이미지와 히트맵은 스토리지(S3)에 저장되며, 결과 응답에 URL이 포함됩니다.",
  },
  {
    question: "로그인 없이도 분석할 수 있나요?",
    answer:
      "현재 서버 설정에 따라 401이 날 수 있습니다. 이 경우 로그인 후 재시도하면 됩니다.",
  },
];

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit = useMemo(
    () => Boolean(file) && !analyzing,
    [file, analyzing],
  );

  const handleAnalyze = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;

    setErrorMessage("");
    setAnalyzing(true);
    setResult(null);

    try {
      const uploadResponse = await uploadDetectionImage(file);
      setResult(uploadResponse);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setErrorMessage("현재 서버 설정상 로그인 후 분석 요청이 가능합니다.");
      } else {
        setErrorMessage("분석 요청에 실패했습니다.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen">
      <NavBar />

      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10">
        <section id="analyze" className="scroll-mt-28">
          <article className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
            <div className="bg-gradient-to-r from-primary to-cyan-700 px-10 py-10 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em]">
                AI Visual Forensics
              </p>
              <h1 className="mt-3 text-5xl font-black leading-tight">
                Image Analyzer
              </h1>
              <p className="mt-4 max-w-3xl text-sm text-white/90">
                이미지 첨부 후 분석 요청을 보내면, 같은 화면에서 바로 결과와
                히트맵을 확인할 수 있습니다.
              </p>
            </div>

            <div className="p-8">
              {!result && (
                <form onSubmit={handleAnalyze} className="space-y-5">
                  <div className="rounded-2xl border-2 border-dashed border-border bg-slate-50 p-10">
                    <h2 className="text-xl font-bold">이미지 첨부</h2>
                    <p className="mt-2 text-sm text-muted">
                      PNG/JPG 파일 1개를 첨부하고 아래 버튼으로 이미지 분석을
                      시작하세요.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        setFile(event.target.files?.[0] ?? null)
                      }
                      className="hidden"
                    />
                    <div className="mt-6 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
                      >
                        이미지 선택
                      </button>
                      <span className="text-sm text-muted">
                        {file ? file.name : "선택된 파일 없음"}
                      </span>
                    </div>
                    <div className="mt-4 hidden">
                      <input
                        readOnly
                        value={file?.name ?? ""}
                        className="block w-full rounded-xl border border-border bg-white px-3 py-3 text-sm"
                      />
                    </div>
                    <div className="mt-4 rounded-lg bg-white px-4 py-3 text-sm text-muted">
                      {file
                        ? `선택된 파일: ${file.name}`
                        : "아직 선택된 파일이 없습니다."}
                    </div>
                    <div className="mt-5 flex justify-end">
                      <button
                        type="submit"
                        disabled={!canSubmit}
                        className="cursor-pointer rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-cyan-500/30 transition hover:from-sky-600 hover:to-cyan-600 disabled:opacity-60"
                      >
                        {analyzing ? "Analyzing..." : "Start Analysis"}
                      </button>
                    </div>
                  </div>
                  {analyzing && (
                    <div className="flex items-center gap-3 rounded-xl bg-cyan-50 px-4 py-3 text-sm">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Analyzing image, please wait...
                    </div>
                  )}
                  {errorMessage && (
                    <p className="text-sm text-danger">{errorMessage}</p>
                  )}
                </form>
              )}

              {result && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black">Analysis Result</h2>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                      새 이미지 분석
                    </button>
                  </div>

                  <dl className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-white p-5 text-sm md:grid-cols-4">
                    <dt className="text-muted">label</dt>
                    <dd className="font-semibold">{result.labelName}</dd>
                    <dt className="text-muted">state</dt>
                    <dd>{result.state}</dd>
                    <dt className="text-muted">confidence</dt>
                    <dd>{formatScore(result.confidence)}</dd>
                    <dt className="text-muted">ssim</dt>
                    <dd>{formatScore(result.ssim)}</dd>
                    <dt className="text-muted">lpips</dt>
                    <dd>{formatScore(result.lpips)}</dd>
                    <dt className="text-muted">rm</dt>
                    <dd>{formatScore(result.rm)}</dd>
                    <dt className="text-muted">pvr</dt>
                    <dd>{formatScore(result.pvr)}</dd>
                  </dl>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                        Original
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={result.originalImageUrl}
                        alt="Original"
                        className="h-[360px] w-full rounded-xl border border-border bg-slate-100 object-contain"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                        Heatmap
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={result.heatmapImageUrl}
                        alt="Heatmap"
                        className="h-[360px] w-full rounded-xl border border-border bg-slate-100 object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>
        </section>

        <section
          id="guide"
          className="mt-14 scroll-mt-28 rounded-3xl border border-border bg-surface p-8 shadow-card"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Interpretation Guide
          </p>
          <h2 className="mt-3 text-2xl font-black">분석 결과 해석 가이드</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white p-5">
              <h3 className="font-semibold">SSIM ↓ + LPIPS ↑</h3>
              <p className="mt-2 text-sm text-muted">
                구조 유사도는 낮고 지각 차이는 큰 패턴입니다. 픽셀 단위 미세
                변조 또는 강한 합성 흔적 가능성을 우선 점검하세요.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-white p-5">
              <h3 className="font-semibold">SSIM ↑ + Confidence 낮음</h3>
              <p className="mt-2 text-sm text-muted">
                표면 구조는 유사하지만 모델 확신이 낮은 경우입니다. 정밀 합성
                기술이 적용된 케이스일 수 있어 추가 검증이 필요합니다.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-white p-5">
              <h3 className="font-semibold">RM / PVR 해석</h3>
              <p className="mt-2 text-sm text-muted">
                RM이 높을수록 고주파 잔차 강도가 전반적으로 크고, PVR이 높을수록
                강한 피크가 넓게 분포한 패턴(노이즈/깨짐/합성 흔적) 가능성이
                큽니다.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-white p-5">
              <h3 className="font-semibold">Heatmap (붉은 영역)</h3>
              <p className="mt-2 text-sm text-muted">
                붉은색 영역은 모델이 위변조 징후를 집중 탐지한 구간입니다.
                원본과 비교해 해당 위치의 경계, 질감, 반복 패턴을 함께
                확인하세요.
              </p>
            </article>
          </div>
          <p className="mt-5 rounded-xl border border-border bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
            RM/PVR은 통계적 신호입니다. 단독 확정 판정 대신
            SSIM/LPIPS/Confidence/Heatmap과 종합 판단하세요.
          </p>
        </section>

        <section
          id="faq"
          className="mt-14 scroll-mt-28 rounded-3xl border border-border bg-surface p-8 shadow-card"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            FAQ
          </p>
          <h2 className="mt-3 text-2xl font-black">자주 묻는 질문</h2>
          <div className="mt-6 space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-border bg-white p-5"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
