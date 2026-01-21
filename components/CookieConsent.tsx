"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X, Shield, ChevronRight } from "lucide-react";

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Verificar se já aceitou cookies
        const consent = localStorage.getItem("cookie-consent");
        if (!consent) {
            // Delay para não aparecer instantaneamente
            const timer = setTimeout(() => {
                setShowBanner(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        setIsAnimating(true);
        localStorage.setItem("cookie-consent", "accepted");
        localStorage.setItem("cookie-consent-date", new Date().toISOString());

        setTimeout(() => {
            setShowBanner(false);
        }, 300);
    };

    const handleDecline = () => {
        setIsAnimating(true);
        localStorage.setItem("cookie-consent", "declined");
        localStorage.setItem("cookie-consent-date", new Date().toISOString());

        setTimeout(() => {
            setShowBanner(false);
        }, 300);
    };

    if (!showBanner) return null;

    return (
        <>
            {/* Overlay sutil */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'
                    }`}
                onClick={handleAccept}
            />

            {/* Banner principal */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 transition-all duration-500 ${isAnimating
                        ? 'translate-y-full opacity-0'
                        : 'translate-y-0 opacity-100'
                    }`}
            >
                <div className="max-w-4xl mx-auto">
                    <div className="relative bg-zinc-900/95 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-emerald-500/20 shadow-2xl shadow-black/30 overflow-hidden">
                        {/* Borda neon sutil no topo */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

                        {/* Glow decorativo */}
                        <div className="absolute top-0 left-1/4 w-1/2 h-20 bg-emerald-500/10 blur-3xl" />

                        <div className="relative p-6 md:p-8">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                {/* Ícone */}
                                <div className="hidden md:flex shrink-0 w-16 h-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                                    <Cookie className="w-8 h-8 text-emerald-400" />
                                </div>

                                {/* Conteúdo */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Cookie className="w-5 h-5 text-emerald-400 md:hidden" />
                                        <h3 className="text-lg md:text-xl font-bold text-white">
                                            Sua privacidade é importante
                                        </h3>
                                    </div>
                                    <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                                        Utilizamos cookies essenciais para o funcionamento do site e para melhorar sua experiência.
                                        Ao continuar navegando, você concorda com nossa política de cookies.
                                    </p>

                                    {/* Links */}
                                    <div className="flex flex-wrap items-center gap-4 pt-1">
                                        <Link
                                            href="/termos"
                                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors group"
                                        >
                                            <Shield className="w-4 h-4" />
                                            Termos de Uso
                                            <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                        </Link>
                                        <Link
                                            href="/privacidade"
                                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors group"
                                        >
                                            <Shield className="w-4 h-4" />
                                            Política de Privacidade
                                            <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Botões */}
                                <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                                    <button
                                        onClick={handleAccept}
                                        className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm md:text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02]"
                                    >
                                        Aceitar Cookies
                                    </button>
                                    <button
                                        onClick={handleDecline}
                                        className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-sm md:text-base border border-zinc-700 hover:border-zinc-600 transition-all duration-300"
                                    >
                                        Recusar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
