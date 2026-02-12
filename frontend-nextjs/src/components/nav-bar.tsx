"use client";

import {
  getAuthServerSnapshot,
  getAuthSnapshot,
  removeAccessToken,
  subscribeAuth,
} from "@/lib/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const loggedIn = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getAuthServerSnapshot,
  );
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === "undefined") return "analyze";
    return window.location.hash.replace("#", "") || "analyze";
  });

  useEffect(() => {
    if (pathname !== "/") return;

    const sectionIds = ["analyze", "guide", "faq"];
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.2, 0.5, 0.8] },
    );

    sectionElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  const handleAnchorClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (pathname !== "/") return;

    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    setActiveSection(id);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `/#${id}`);
  };

  const navLinkClass = (id: string) =>
    `rounded-md px-3 py-1.5 transition ${
      pathname === "/" && activeSection === id
        ? "bg-blue-50/80 text-primary"
        : "text-foreground hover:bg-blue-50/70 hover:text-primary"
    }`;

  const handleLogout = () => {
    removeAccessToken();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-lg font-black tracking-tight text-primary">
          Is It AI
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link
            href="/#analyze"
            onClick={(event) => handleAnchorClick(event, "analyze")}
            className={navLinkClass("analyze")}
          >
            Analyze
          </Link>
          <Link
            href="/#guide"
            onClick={(event) => handleAnchorClick(event, "guide")}
            className={navLinkClass("guide")}
          >
            Guide
          </Link>
          <Link
            href="/#faq"
            onClick={(event) => handleAnchorClick(event, "faq")}
            className={navLinkClass("faq")}
          >
            FAQ
          </Link>
          <Link
            href="/history"
            className={`rounded-md px-3 py-1.5 transition ${
              pathname === "/history"
                ? "bg-blue-50/80 text-primary"
                : "text-foreground hover:bg-blue-50/70 hover:text-primary"
            }`}
          >
            History
          </Link>
          {!loggedIn && (
            <>
              <Link
                href="/signup"
                className="rounded-md border border-border px-3 py-1.5 hover:bg-white"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-border bg-white px-3 py-1.5 font-semibold text-foreground shadow-sm transition hover:bg-blue-50/70"
              >
                Log in
              </Link>
            </>
          )}
          {loggedIn && (
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer rounded-md border border-border px-3 py-1.5 hover:bg-white"
            >
              Log out
            </button>
          )}
        </nav>
      </div>
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-4 overflow-x-auto px-5 pb-3 text-xs md:hidden">
        <Link
          href="/#analyze"
          onClick={(event) => handleAnchorClick(event, "analyze")}
          className={`whitespace-nowrap rounded-md px-2 py-1 ${
            pathname === "/" && activeSection === "analyze"
              ? "bg-blue-50/80 text-primary"
              : "text-foreground"
          }`}
        >
          Analyze
        </Link>
        <Link
          href="/#guide"
          onClick={(event) => handleAnchorClick(event, "guide")}
          className={`whitespace-nowrap rounded-md px-2 py-1 ${
            pathname === "/" && activeSection === "guide"
              ? "bg-blue-50/80 text-primary"
              : "text-foreground"
          }`}
        >
          Guide
        </Link>
        <Link
          href="/#faq"
          onClick={(event) => handleAnchorClick(event, "faq")}
          className={`whitespace-nowrap rounded-md px-2 py-1 ${
            pathname === "/" && activeSection === "faq"
              ? "bg-blue-50/80 text-primary"
              : "text-foreground"
          }`}
        >
          FAQ
        </Link>
        <Link
          href="/history"
          className={`whitespace-nowrap rounded-md px-2 py-1 ${
            pathname === "/history" ? "bg-blue-50/80 text-primary" : "text-foreground"
          }`}
        >
          History
        </Link>
        {!loggedIn && (
          <>
            <Link href="/signup" className="ml-auto whitespace-nowrap">
              Sign up
            </Link>
            <Link
              href="/login"
              className="whitespace-nowrap rounded-md border border-border bg-white px-2.5 py-1 font-semibold text-foreground"
            >
              Log in
            </Link>
          </>
        )}
        {loggedIn && (
          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto whitespace-nowrap text-danger"
          >
            Log out
          </button>
        )}
      </nav>
    </header>
  );
}
