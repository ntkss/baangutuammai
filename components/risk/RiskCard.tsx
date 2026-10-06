"use client";

import type { RiskLevel, ConfidenceLevel } from "@/lib/types/domain";
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Lightbulb,
  Check,
  Minus,
  AlertCircle,
} from "lucide-react";
import {
  RISK_LEVEL_LABEL,
  RISK_LEVEL_DESCRIPTION,
  CONFIDENCE_LABEL,
  CONFIDENCE_DESCRIPTION,
  UI_TEXT,
} from "@/lib/i18n/th";

// ─── Risk Icon Components ──────────────────────────────────────────────────

export function getRiskLucideIcon(level: RiskLevel, size = 28) {
  switch (level) {
    case "low":
      return (
        <ShieldCheck size={size} strokeWidth={2.2} color="var(--color-low)" />
      );
    case "watch":
      return (
        <AlertTriangle
          size={size}
          strokeWidth={2.2}
          color="var(--color-watch)"
        />
      );
    case "high":
      return (
        <AlertOctagon size={size} strokeWidth={2.2} color="var(--color-high)" />
      );
    case "severe":
      return (
        <ShieldAlert
          size={size}
          strokeWidth={2.2}
          color="var(--color-severe)"
        />
      );
  }
}

export function RiskIcon({ level }: { level: RiskLevel }) {
  return (
    <div className={`risk-icon risk-icon--${level}`} aria-hidden="true">
      {getRiskLucideIcon(level, 40)}
    </div>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`risk-badge risk-badge--${level}`}>
      {getRiskLucideIcon(level, 14)} {RISK_LEVEL_LABEL[level]}
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
  zoneLabel?: string;
}

export function RiskStatusCard({
  level,
  reasons,
  confidence,
  updatedAt,
  recommendedAction,
  zoneLabel,
}: RiskStatusCardProps) {
  const updatedDate = new Date(updatedAt);
  const timeStr = updatedDate.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });

  const levelColor = getLevelColor(level);

  // Background tint gradients per level
  const bgGradients = {
    low: "linear-gradient(135deg, rgba(236, 253, 245, 0.95), rgba(240, 253, 250, 0.8))",
    watch:
      "linear-gradient(135deg, rgba(254, 252, 232, 0.95), rgba(255, 251, 235, 0.8))",
    high: "linear-gradient(135deg, rgba(255, 247, 237, 0.95), rgba(254, 242, 242, 0.8))",
    severe:
      "linear-gradient(135deg, rgba(254, 242, 242, 0.95), rgba(255, 241, 242, 0.8))",
  };

  const borderColors = {
    low: "rgba(167, 243, 208, 0.8)",
    watch: "rgba(253, 230, 138, 0.8)",
    high: "rgba(254, 215, 170, 0.8)",
    severe: "rgba(254, 202, 202, 0.8)",
  };

  return (
    <div
      className="card card--elevated"
      style={{
        background: bgGradients[level],
        border: `1px solid ${borderColors[level]}`,
        padding: "18px",
        borderRadius: "20px",
      }}
    >
      {/* Top row: Status header + Confidence Badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: zoneLabel ? "6px" : "12px",
        }}
      >
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--color-text-secondary)",
          }}
        >
          ประเมินสถานการณ์ล่าสุด
        </span>
        <ConfidenceChip level={confidence} />
      </div>

      {zoneLabel && (
        <div
          style={{
            fontSize: "0.7rem",
            color: "var(--color-text-muted)",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>📍</span>
          <span>โมเดลพื้นที่: <strong>{zoneLabel}</strong></span>
        </div>
      )}

      {/* Main hero status display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            flexShrink: 0,
          }}
        >
          {getRiskLucideIcon(level, 32)}
        </div>

        <div>
          <h1
            style={{
              fontSize: "1.45rem",
              fontWeight: 800,
              margin: 0,
              color: levelColor,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {RISK_LEVEL_LABEL[level]}
          </h1>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--color-text-secondary)",
              margin: "3px 0 0 0",
              lineHeight: 1.4,
            }}
          >
            {RISK_LEVEL_DESCRIPTION[level]}
          </p>
        </div>
      </div>

      {/* Key Reasons - concise chips rather than endless bullets */}
      {reasons.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: recommendedAction ? "10px" : "12px",
          }}
        >
          {reasons.map((r, i) => (
            <span
              key={i}
              style={{
                fontSize: "0.72rem",
                padding: "3px 8px",
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.75)",
                border: "1px solid rgba(0, 0, 0, 0.05)",
                color: "var(--color-text-primary)",
              }}
            >
              • {r}
            </span>
          ))}
        </div>
      )}

      {/* Recommended action */}
      {recommendedAction && (
        <div
          style={{
            padding: "8px 10px",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.85)",
            border: `1px solid ${borderColors[level]}`,
            fontSize: "0.75rem",
            color: "var(--color-text-primary)",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Lightbulb size={16} strokeWidth={2.2} color="var(--color-watch)" />
          <span style={{ fontWeight: 600 }}>{recommendedAction}</span>
        </div>
      )}

      {/* Footer: updated time */}
      <div
        style={{
          borderTop: "1px solid rgba(0, 0, 0, 0.05)",
          paddingTop: "8px",
          fontSize: "0.68rem",
          color: "var(--color-text-muted)",
          textAlign: "right",
        }}
      >
        {UI_TEXT.updatedAt} {timeStr} น.
      </div>
    </div>
  );
}

// ─── Confidence chip ──────────────────────────────────────────────────────

export function ConfidenceChip({ level }: { level: ConfidenceLevel }) {
  const IconComponent =
    level === "high" ? Check : level === "medium" ? Minus : AlertCircle;

  return (
    <span
      className={`confidence-chip confidence-chip--${level}`}
      title={CONFIDENCE_DESCRIPTION[level]}
      style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
    >
      <IconComponent size={12} strokeWidth={2.5} />
      <span>{CONFIDENCE_LABEL[level]}</span>
    </span>
  );
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────

export function RiskCardSkeleton() {
  return (
    <div className="card card--elevated" style={{ textAlign: "center" }}>
      <div
        className="skeleton"
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          margin: "0 auto 16px",
        }}
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
      <div
        className="skeleton"
        style={{ height: 12, width: "40%", margin: "0 auto" }}
      />
    </div>
  );
}

export function DataCardSkeleton() {
  return (
    <div className="card">
      <div
        className="skeleton"
        style={{ height: 16, width: "40%", marginBottom: 12 }}
      />
      <div
        className="skeleton"
        style={{ height: 14, width: "90%", marginBottom: 8 }}
      />
      <div
        className="skeleton"
        style={{ height: 14, width: "70%", marginBottom: 8 }}
      />
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
