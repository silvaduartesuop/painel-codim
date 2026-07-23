import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel Déficit CODIM",
  description: "Painel de análise de execução orçamentária - CODIM/SUOP/SEFIN",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
