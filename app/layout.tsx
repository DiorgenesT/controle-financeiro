import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { DisableInputScroll } from "@/components/DisableInputScroll";
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
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <DisableInputScroll />
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                classNames: {
                  toast: "bg-background border-border text-foreground",
                  title: "text-foreground",
                  description: "text-muted-foreground",
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
