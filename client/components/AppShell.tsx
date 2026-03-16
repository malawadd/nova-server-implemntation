"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/app", icon: "◈", label: "DASHBOARD", exact: true },
  { href: "/app/sessions", icon: "▷", label: "SESSIONS", exact: false },
  { href: "/app/library", icon: "▤", label: "LIBRARY", exact: false },
  { href: "/app/insights", icon: "▦", label: "INSIGHTS", exact: false },
  { href: "/app/settings", icon: "◎", label: "SETTINGS", exact: false },
];

function useActiveHref(href: string, exact: boolean) {
  const pathname = usePathname();
  return exact ? pathname === href : pathname.startsWith(href);
}

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {!isMobile && <Sidebar />}

      <main
        style={{
          marginLeft: isMobile ? 0 : 220,
          minHeight: "100vh",
          paddingBottom: isMobile ? 80 : 0,
        }}
      >
        {children}
      </main>

      {isMobile && <BottomNav />}
    </div>
  );
}

function Sidebar() {
  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: 220,
        height: "100vh",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        background: "var(--retro-surface)",
        borderRight: "var(--border-width) solid var(--border)",
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "16px", borderBottom: "var(--border-width) solid var(--border)", flexShrink: 0 }}>
        <Link href="/app" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: "0.15em", color: "var(--retro-neon-cyan)" }}>
            NEURO<span style={{ color: "var(--retro-neon-pink)" }}>FEEDBACK</span>
          </span>
        </Link>
      </div>

      {/* New Session CTA */}
      <div style={{ padding: "12px", borderBottom: "var(--border-width) solid var(--border)", flexShrink: 0 }}>
        <Link
          href="/app/sessions/new"
          className="hybrid-button"
          style={{ display: "block", textAlign: "center", textDecoration: "none", padding: "8px 12px", fontSize: 12 }}
        >
          ⚡ NEW SESSION
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {NAV_ITEMS.map((item) => (
          <SideNavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Back to landing */}
      <div style={{ padding: "12px", borderTop: "var(--border-width) solid var(--border)", flexShrink: 0 }}>
        <Link
          href="/"
          style={{
            display: "block",
            textAlign: "center",
            textDecoration: "none",
            fontSize: 11,
            letterSpacing: "0.1em",
            color: "var(--foreground)",
            opacity: 0.5,
            padding: "6px",
            border: "var(--border-width) solid var(--border)",
          }}
        >
          ← LANDING
        </Link>
      </div>
    </aside>
  );
}

function SideNavLink({ href, icon, label, exact }: { href: string; icon: string; label: string; exact: boolean }) {
  const active = useActiveHref(href, exact);

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        textDecoration: "none",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: "0.1em",
        background: active ? `color-mix(in srgb, var(--retro-neon-pink) 15%, var(--retro-surface))` : "transparent",
        color: active ? "var(--retro-neon-pink)" : "var(--foreground)",
        borderLeft: active ? "3px solid var(--retro-neon-pink)" : "3px solid transparent",
        transition: "all 0.15s",
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: "flex",
        background: "var(--retro-surface)",
        borderTop: "var(--border-width) solid var(--border)",
        height: 64,
      }}
    >
      {NAV_ITEMS.map((item) => (
        <BottomNavLink key={item.href} {...item} />
      ))}
    </nav>
  );
}

function BottomNavLink({ href, icon, label, exact }: { href: string; icon: string; label: string; exact: boolean }) {
  const active = useActiveHref(href, exact);

  return (
    <Link
      href={href}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        textDecoration: "none",
        background: active ? `color-mix(in srgb, var(--retro-neon-pink) 12%, var(--retro-surface))` : "var(--retro-surface)",
        borderRight: "var(--border-width) solid var(--border)",
        borderTop: active ? "3px solid var(--retro-neon-pink)" : "3px solid transparent",
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span
        style={{
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: active ? "var(--retro-neon-pink)" : "var(--foreground)",
          opacity: active ? 1 : 0.55,
        }}
      >
        {label}
      </span>
    </Link>
  );
}