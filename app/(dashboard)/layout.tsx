"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { user, loading, isFirstAccess, isSubscriptionValid } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (isFirstAccess) {
                router.push("/alterar-senha");
            } else if (!isSubscriptionValid) {
                router.push("/assinatura-expirada");
            }
        }
    }, [user, loading, isFirstAccess, isSubscriptionValid, router]);

    // Ocultar reCAPTCHA badge em todas as páginas do dashboard
    useEffect(() => {
        document.body.classList.add('hide-recaptcha');
        return () => {
            document.body.classList.remove('hide-recaptcha');
        };
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    // Redirect states
    if (!user || isFirstAccess || !isSubscriptionValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                    <p className="text-muted-foreground">Redirecionando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div className="pl-0 md:pl-64 transition-all duration-300 peer-[[data-collapsed=true]]:pl-20">
                <main className="min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
