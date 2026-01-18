"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ArrowRight, LogOut, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function AssinaturaExpiradaPage() {
    const router = useRouter();
    const { user, loading, isSubscriptionValid, signOut } = useAuth();
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    useEffect(() => {
        // If subscription is valid, redirect to dashboard
        if (!loading && user && isSubscriptionValid) {
            router.push("/dashboard");
        }
    }, [loading, user, isSubscriptionValid, router]);

    const handleRenew = async () => {
        setCheckoutLoading(true);
        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user?.email }),
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Erro ao iniciar pagamento. Tente novamente.");
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert("Erro ao iniciar pagamento. Tente novamente.");
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
    };

    const formatDate = (date?: Date) => {
        if (!date) return "N/A";
        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }).format(date);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/">
                        <Image
                            src="/logo-new.png"
                            alt="Tudo Em Dia"
                            width={160}
                            height={50}
                            className="object-contain"
                        />
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
                        <AlertTriangle className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Sua Assinatura Expirou
                    </h1>

                    <p className="text-gray-600 mb-6">
                        Para continuar usando o <strong>Tudo Em Dia</strong>, renove sua assinatura.
                    </p>

                    {user?.subscriptionEnd && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                            <Calendar className="w-4 h-4" />
                            <span>Expirou em: {formatDate(user.subscriptionEnd)}</span>
                        </div>
                    )}

                    {/* Pricing */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-6 border border-emerald-200">
                        <p className="text-sm text-emerald-700 font-medium mb-2">Plano Anual</p>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-sm text-gray-500">R$</span>
                            <span className="text-4xl font-bold text-emerald-600">67</span>
                            <span className="text-xl text-emerald-600">,90</span>
                            <span className="text-gray-500">/ano</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Menos de R$ 6/mês</p>
                    </div>

                    <Button
                        onClick={handleRenew}
                        disabled={checkoutLoading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-12 text-lg font-semibold rounded-xl shadow-lg shadow-emerald-500/30 mb-4"
                    >
                        {checkoutLoading ? "Carregando..." : "Renovar Assinatura"}
                        {!checkoutLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                    </Button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair da conta
                    </button>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Precisa de ajuda?{" "}
                    <a href="mailto:contato@tatudoemdia.com.br" className="text-emerald-600 hover:underline">
                        Entre em contato
                    </a>
                </p>
            </div>
        </div>
    );
}
