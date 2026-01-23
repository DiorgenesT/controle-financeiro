import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RecaptchaProvider } from "@/components/RecaptchaProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { DisableInputScroll } from "@/components/DisableInputScroll";
import "./globals.css";
import "./driver-theme.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tudo Em Dia | Controle Financeiro Inteligente",
    template: "%s | Tudo Em Dia",
  },
  description: "Sistema de controle financeiro pessoal com relatórios, metas e insights automáticos. Organize suas finanças de forma simples e eficiente.",
  keywords: ["finanças", "controle financeiro", "dinheiro", "orçamento", "metas financeiras", "tudo em dia", "gestão financeira"],
  authors: [{ name: "Tudo Em Dia" }],
  creator: "Tudo Em Dia",
  publisher: "Tudo Em Dia",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Tudo Em Dia | Controle Financeiro Inteligente",
    description: "Sistema de controle financeiro pessoal com relatórios, metas e insights automáticos.",
    url: "https://tatudoemdia.com.br",
    siteName: "Tudo Em Dia",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tudo Em Dia - Controle Financeiro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tudo Em Dia | Controle Financeiro Inteligente",
    description: "Organize suas finanças de forma simples e eficiente.",
    images: ["/og-image.png"],
    creator: "@tudoemdia",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <RecaptchaProvider>
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
          </RecaptchaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
