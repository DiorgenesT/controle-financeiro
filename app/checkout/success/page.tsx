"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sessionId) {
            // Here you could fetch the session details if needed
            // For now, we just simulate a loading state
            const timer = setTimeout(() => setLoading(false), 1000);
            return () => clearTimeout(timer);
        } else {
            setLoading(false);
        }
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-zinc-100">
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                        <p className="text-zinc-600">Verificando pagamento...</p>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>

                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Pagamento Confirmado!</h1>
                        <p className="text-zinc-500 mb-8">
                            Sua assinatura do Tudo Em Dia foi iniciada com sucesso. Você receberá um e-mail com os detalhes.
                        </p>

                        <Link href="/dashboard">
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all">
                                Acessar Dashboard
                            </Button>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
