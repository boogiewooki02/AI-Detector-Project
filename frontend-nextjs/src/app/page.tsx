"use client";

import NavBar from "@/components/nav-bar";
import { uploadDetectionImage } from "@/lib/api";
import { getAccessToken, subscribeAuth } from "@/lib/auth";
import type { DetectionResponse } from "@/lib/types";
import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";

function formatScore(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toFixed(4);
}

const faqItems = [
  {
    question: "AI 판정 등급(Zone A~D)은 어떤 기준으로 분류되나요?",
    answer:
      "본 서비스는 이미지의 구조적 유사도(SSIM)와 지각적 품질(LPIPS)을 복합 분석하여 4단계로 분류합니다. 원본 상태인 Zone A부터, 육안 식별이 어려운 고도로 정밀한 합성형인 Zone B, 물리적 왜곡이 뚜렷한 Zone C/D로 구분하여 리스크를 정의합니다.",
  },
  {
    question: "분석 리포트에 표시된 SSIM과 LPIPS는 무엇을 의미하나요?",
    answer:
      "SSIM은 이미지의 형태적 틀이 얼마나 유지되었는지를 나타내며, LPIPS는 인간이 느끼는 시각적 자연스러움을 측정합니다. 두 수치가 상충할 경우(예: 시각적으로는 자연스러우나 구조가 변형된 경우) 생성형 AI에 의한 정밀 조작 가능성이 높다고 판단합니다.",
  },
  {
    question: "히트맵(Heatmap)의 붉은 영역은 무엇을 나타내나요?",
    answer:
      "AI 모델이 위변조의 결정적 증거라고 판단한 집중 분석 구역입니다. 주로 사물의 경계면이나 부자연스러운 노이즈가 발생하는 지점에 나타나며, 분석가는 이 영역을 통해 변조 의심 지점을 시각적으로 즉시 확인할 수 있습니다.",
  },
  {
    question: "이미지를 업로드했는데 분석이 진행되지 않습니다.",
    answer:
      "인증 세션이 만료되었거나 서버와의 연결이 불안정할 때 발생할 수 있습니다. 오류가 발생한다면 재로그인을 진행해 주시고, 문제가 지속될 경우 이미지 파일 형식이 JPG 또는 PNG인지 확인해 주세요.",
  },
];

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resultSectionRef = useRef<HTMLDivElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [topNotice, setTopNotice] = useState("");

  const canSubmit = useMemo(() => !analyzing, [analyzing]);

  const resetAnalyzeState = () => {
    setFile(null);
    setResult(null);
    setErrorMessage("");
    setTopNotice("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleAnalyze = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setTopNotice("이미지를 먼저 첨부해주세요.");
      return;
    }

    setErrorMessage("");
    setAnalyzing(true);
    setResult(null);

    try {
      const uploadResponse = await uploadDetectionImage(file);
      setResult(uploadResponse);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setErrorMessage("인증 오류가 발생했습니다. 다시 시도해주세요.");
      } else {
        setErrorMessage("분석 요청에 실패했습니다.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    resetAnalyzeState();
  };

  const handleRemoveSelectedImage = () => {
    setFile(null);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setErrorMessage("");
  };

  const handleDropFile = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  useEffect(() => {
    if (!topNotice) return;
    const timer = setTimeout(() => setTopNotice(""), 2600);
    return () => clearTimeout(timer);
  }, [topNotice]);

  useEffect(() => {
    if (!result) return;
    if (!resultSectionRef.current) return;

    const top =
      resultSectionRef.current.getBoundingClientRect().top +
      window.scrollY -
      110;
    window.scrollTo({ top, behavior: "smooth" });
  }, [result]);

  useEffect(() => {
    return subscribeAuth(() => {
      if (!getAccessToken()) {
        resetAnalyzeState();
      }
    });
  }, []);

  return (
    <div className="min-h-screen">
      <NavBar />

      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10">
        {topNotice && (
          <div className="fixed left-1/2 top-20 z-[60] w-full max-w-md -translate-x-1/2 px-4">
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm shadow-lg shadow-amber-100/60">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                !
              </span>
              <p className="font-medium text-amber-900">{topNotice}</p>
            </div>
          </div>
        )}

        <section id="analyze" className="scroll-mt-28">
          <article className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
            <div className="border-b border-border bg-slate-50 px-10 py-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                AI Visual Forensics
              </p>
              <h1 className="mt-3 text-5xl font-black leading-tight text-foreground">
                Image Analyzer
              </h1>
              <p className="mt-4 max-w-3xl text-sm text-muted">
                이미지 첨부 후 분석 요청을 보내면, 같은 화면에서 바로 결과와
                히트맵을 확인할 수 있습니다.
              </p>
            </div>

            <div className="p-8">
              {!result && (
                <form onSubmit={handleAnalyze} className="space-y-5">
                  <div className="rounded-2xl border border-border bg-white p-8">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        handleFileSelect(event.target.files?.[0] ?? null)
                      }
                      className="hidden"
                    />
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                      <div
                        onDragOver={(event) => {
                          if (analyzing) return;
                          event.preventDefault();
                          setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(event) => {
                          if (analyzing) return;
                          handleDropFile(event);
                        }}
                        onClick={() => {
                          if (analyzing) return;
                          fileInputRef.current?.click();
                        }}
                        className={`relative flex min-h-[320px] items-center justify-center rounded-xl border-2 border-dashed bg-slate-50 p-6 transition ${
                          isDragOver
                            ? "border-primary bg-cyan-50"
                            : "border-border hover:border-primary/60"
                        } ${analyzing ? "cursor-default" : "cursor-pointer"}`}
                      >
                        {!previewUrl && (
                          <div className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-6 w-6 text-primary"
                                aria-hidden="true"
                              >
                                <path
                                  d="M12 16V4M12 4L7 9M12 4L17 9M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              클릭하여 업로드 또는 드래그 앤 드롭
                            </p>
                            <p className="mt-2 text-xs text-muted">
                              PNG, JPG 파일 지원
                            </p>
                          </div>
                        )}
                        {previewUrl && (
                          <>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveSelectedImage();
                              }}
                              aria-label="선택 이미지 제거"
                              disabled={analyzing}
                              className="cursor-pointer absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-sm font-bold text-muted hover:bg-slate-100 disabled:opacity-40"
                            >
                              ×
                            </button>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrl}
                              alt="Selected preview"
                              className="h-full max-h-[280px] w-full rounded-lg border border-border bg-white object-contain"
                            />
                          </>
                        )}
                        {analyzing && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-white/75 backdrop-blur-[1px]">
                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <p className="mt-3 text-sm font-semibold text-foreground">
                              분석 중입니다...
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              잠시만 기다려주세요
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between rounded-xl border border-border bg-slate-50 p-6">
                        <div>
                          <h2 className="text-xl font-bold">이미지 첨부</h2>
                          <p className="mt-2 text-sm text-muted">
                            좌측 영역에 이미지를 업로드하면 프리뷰가 표시됩니다.
                            <br></br>
                            준비되면 아래 버튼으로 분석을 시작하세요.
                          </p>
                          <p className="mt-4 rounded-lg bg-white px-4 py-3 text-sm text-muted">
                            {file
                              ? `선택된 파일: ${file.name}`
                              : "아직 선택된 파일이 없습니다."}
                          </p>
                        </div>
                        <div className="mt-6">
                          <button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-full cursor-pointer rounded-lg bg-[#3f8fa3] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#66adbe] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {analyzing ? "Analyzing..." : "Start Analysis"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {errorMessage && (
                    <p className="text-sm text-danger">{errorMessage}</p>
                  )}
                </form>
              )}

              {result && (
                <div ref={resultSectionRef} className="space-y-5">
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
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">SSIM ↓ LPIPS ↑</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                구조가 붕괴되고 지각적 이질성이 극대화된 Failure 패턴입니다.
                이미지 전반의 물리적 지표가 최악인 상태로, 명백한 위변조
                가능성을 시사합니다.
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">SSIM ↓ LPIPS ↓</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                시각적으로는 자연스러우나 구조적 차이가 발생하는 Sleek Fake
                패턴입니다. 정교한 생성형 AI 기술이 적용된 케이스이므로 히트맵의
                경계면을 정밀 검계하세요.
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-white p-5">
              <h3 className="font-bold">RM & PVR 잔차 분석</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                RM 수치는 고주파 잔차의 전반적 강도를, PVR은 특정 구간의 강한
                노이즈 피크 분포를 의미합니다. 수치가 급증했다면 육안으로
                식별하기 어려운 미세 합성 흔적을 의심해야 합니다.
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-white p-5">
              <h3 className="font-bold">Heatmap (집중 탐지 영역)</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                붉은 영역은 모델이 픽셀 불연속성이나 인위적 아티팩트를 포착한
                핵심 근거지입니다. 해당 위치의 질감 왜곡이나 반복적인 패턴 발생
                여부를 중점적으로 판독하세요.
              </p>
            </article>
          </div>

          {/* <p className="mt-5 rounded-xl border border-[#dbe7d4] bg-[#f4f8f1] px-4 py-3 text-sm text-[#2f4331] shadow-xs">
            RM/PVR 등 통계적 신호는 단독 판정의 근거가 될 수 없습니다. 반드시
            모델 확신도 및 시각적 히트맵과 연계하여 종합적인 포렌식 결론을
            도출하십시오.
          </p> */}
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
