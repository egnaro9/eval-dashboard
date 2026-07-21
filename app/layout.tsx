import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Eval Dashboard",
  description: "Visualize RAG evaluation runs and flag hallucinations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="https://egnaro9.github.io"
          aria-label="Back to portfolio"
          style={{
            position: "fixed",
            top: "12px",
            left: "14px",
            zIndex: 9999,
            fontFamily: "ui-monospace,Menlo,monospace",
            fontSize: "13px",
            fontWeight: 600,
            color: "#f2a53c",
            background: "rgba(14,19,22,.86)",
            border: "1px solid rgba(242,165,60,.45)",
            borderRadius: "4px",
            padding: "6px 11px",
            textDecoration: "none",
            backdropFilter: "blur(4px)",
          }}
        >
          ← Portfolio
        </a>
        {children}
      </body>
    </html>
  );
}
