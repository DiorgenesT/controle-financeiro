"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

function SucessoContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Give time for webhook to process
        const timer = setTimeout(() => {
            setLoading(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, [sessionId]);

    return (
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
            {loading ? (
                <div className="animate-pulse">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto mb-6"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
                </div>
            ) : (
                <>
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Pagamento Confirmado! 🎉
                    </h1>

                    <p className="text-gray-600 mb-6">
                        Sua assinatura do <strong>Tudo Em Dia</strong> foi ativada com sucesso.
                    </p>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-2 text-amber-800 mb-2">
                            <Mail className="w-5 h-5" />
                            <span className="font-semibold">Verifique seu email!</span>
                        </div>
                        <p className="text-sm text-amber-700">
                            Enviamos suas credenciais de acesso para o email cadastrado.
                            Verifique também a pasta de spam.
                        </p>
                    </div>

                    <Link href="/login">
                        <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-12 text-lg font-semibold rounded-xl shadow-lg shadow-emerald-500/30">
                            Acessar Minha Conta
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>

                    <p className="text-sm text-gray-500 mt-6">
                        Precisa de ajuda?{" "}
                        <a href="mailto:contato@tatudoemdia.com.br" className="text-emerald-600 hover:underline">
                            Entre em contato
                        </a>
                    </p>
                </>
            )}
        </div>
    );
}

export default function SucessoPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-6">
            <Suspense fallback={
                <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center animate-pulse">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto mb-6"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
                </div>
            }>
                <SucessoContent />
            </Suspense>
        </div>
    );
}
