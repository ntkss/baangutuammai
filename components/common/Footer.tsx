import { UI_TEXT } from "@/lib/i18n/th";

interface FooterProps {
  showDisclaimer?: boolean;
}

export function Footer({ showDisclaimer = true }: FooterProps) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "2.0.0";
  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || "dev";

  return (
    <footer
      style={{
        marginTop: "24px",
        marginBottom: "8px",
        textAlign: "center",
        fontSize: "0.72rem",
        color: "var(--color-text-muted)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {showDisclaimer && (
        <p
          style={{
            margin: 0,
            lineHeight: 1.6,
            maxWidth: "480px",
          }}
        >
          {UI_TEXT.disclaimer}
        </p>
      )}

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 10px",
          borderRadius: "12px",
          background: "rgba(0, 0, 0, 0.03)",
          border: "1px solid var(--color-border)",
          fontSize: "0.68rem",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          color: "var(--color-text-muted)",
          letterSpacing: "0.02em",
        }}
      >
        <span>
          v{version} {commitHash}
        </span>
      </div>
    </footer>
  );
}
