import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Eval Dashboard",
  description: "Visualize RAG evaluation runs and flag hallucinations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
