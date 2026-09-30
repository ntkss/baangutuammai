"use client";

import type { RiskLevel, ConfidenceLevel } from "@/lib/types/domain";
import {
  RISK_LEVEL_LABEL,
  RISK_LEVEL_DESCRIPTION,
  CONFIDENCE_LABEL,
  CONFIDENCE_DESCRIPTION,
  RISK_EMOJI,
  UI_TEXT,
} from "@/lib/i18n/th";

// ─── Risk Icon ────────────────────────────────────────────────────────────

export function RiskIcon({ level }: { level: RiskLevel }) {
  return (
    <div className={`risk-icon risk-icon--${level}`} aria-hidden="true">
      {RISK_EMOJI[level]}
    </div>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`risk-badge risk-badge--${level}`}>
      {RISK_EMOJI[level]} {RISK_LEVEL_LABEL[level]}
    </span>
  );
}

// ─── Risk Status Card (primary hero card) ────────────────────────────────

interface RiskStatusCardProps {
  level: RiskLevel;
  reasons: string[];
  confidence: ConfidenceLevel;
  updatedAt: string;
  recommendedAction?: string;
}

export function RiskStatusCard({
  level,
  reasons,
  confidence,
  updatedAt,
  recommendedAction,
}: RiskStatusCardProps) {
  const updatedDate = new Date(updatedAt);
  const timeStr = updatedDate.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });

  return (
    <div className={`card card--elevated`} style={{ textAlign: "center" }}>
      {/* Icon */}
      <div style={{ marginBottom: "16px" }}>
        <RiskIcon level={level} />
      </div>

      {/* Level label */}
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          margin: "0 0 8px 0",
          color: getLevelColor(level),
        }}
      >
        {RISK_LEVEL_LABEL[level]}
      </h1>

      {/* Short description */}
      <p
        style={{
          fontSize: "0.95rem",
          color: "var(--color-text-secondary)",
          margin: "0 0 20px 0",
          lineHeight: 1.7,
        }}
      >
        {RISK_LEVEL_DESCRIPTION[level]}
      </p>

      {/* Reasons */}
      {reasons.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 20px 0",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {reasons.map((r, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                textAlign: "left",
                fontSize: "0.875rem",
                color: "var(--color-text-primary)",
              }}
            >
              <span style={{ color: getLevelColor(level), marginTop: "2px" }}>•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Recommended action */}
      {recommendedAction && (
        <div
          className="notice notice--warning"
          style={{ marginBottom: "16px", textAlign: "left" }}
        >
          <span>⚠️</span>
          <span>{recommendedAction}</span>
        </div>
      )}

      <hr className="divider" style={{ margin: "12px 0" }} />

      {/* Footer: updated time + confidence */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.78rem",
          color: "var(--color-text-muted)",
        }}
      >
        <span>
          {UI_TEXT.updatedAt} {timeStr} น.
        </span>
        <ConfidenceChip level={confidence} />
      </div>
    </div>
  );
}

// ─── Confidence chip ──────────────────────────────────────────────────────

export function ConfidenceChip({ level }: { level: ConfidenceLevel }) {
  return (
    <span
      className={`confidence-chip confidence-chip--${level}`}
      title={CONFIDENCE_DESCRIPTION[level]}
    >
      {level === "high" ? "✓" : level === "medium" ? "~" : "!"} {CONFIDENCE_LABEL[level]}
    </span>
  );
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────

export function RiskCardSkeleton() {
  return (
    <div className="card card--elevated" style={{ textAlign: "center" }}>
      <div
        className="skeleton"
        style={{ width: 88, height: 88, borderRadius: "50%", margin: "0 auto 16px" }}
      />
      <div
        className="skeleton"
        style={{ height: 32, width: "50%", margin: "0 auto 12px" }}
      />
      <div
        className="skeleton"
        style={{ height: 16, width: "80%", margin: "0 auto 8px" }}
      />
      <div
        className="skeleton"
        style={{ height: 16, width: "65%", margin: "0 auto 20px" }}
      />
      <div className="skeleton" style={{ height: 12, width: "40%", margin: "0 auto" }} />
    </div>
  );
}

export function DataCardSkeleton() {
  return (
    <div className="card">
      <div className="skeleton" style={{ height: 16, width: "40%", marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 14, width: "90%", marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 14, width: "80%" }} />
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────

function getLevelColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "var(--color-low)";
    case "watch":
      return "var(--color-watch)";
    case "high":
      return "var(--color-high)";
    case "severe":
      return "var(--color-severe)";
  }
}
