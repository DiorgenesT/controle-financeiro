import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tudo Em Dia | Controle Financeiro Inteligente",
  description: "Sistema de controle financeiro pessoal com relatórios, metas e insights automáticos.",
  keywords: ["finanças", "controle financeiro", "dinheiro", "orçamento", "metas financeiras", "tudo em dia"],
  authors: [{ name: "Tudo Em Dia" }],
  openGraph: {
    title: "Tudo Em Dia | Controle Financeiro Inteligente",
    description: "Sistema de controle financeiro pessoal com relatórios, metas e insights automáticos.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: "bg-zinc-900 border-zinc-800",
                title: "text-white",
                description: "text-zinc-400",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
