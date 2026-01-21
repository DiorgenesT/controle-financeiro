"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, AlertCircle, CheckCircle2, ArrowLeft, KeyRound, Send } from "lucide-react";

export default function EsqueciSenhaPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Mouse follow effect on card
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        };

        card.addEventListener('mousemove', handleMouseMove);
        return () => card.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erro ao enviar email");
            }

            setSuccess(true);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erro ao enviar email. Tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md auth-page-enter">
            {/* Logo com glow */}
            <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/30 blur-3xl rounded-full scale-150" />
                <div className="relative w-56 h-20">
                    <Image
                        src="/logo-new.png"
                        alt="Tudo Em Dia"
                        fill
                        className="object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                        priority
                    />
                </div>
            </div>

            {/* Card principal com efeito de borda neon */}
            <div
                ref={cardRef}
                className="relative w-full group auth-card-enter"
                style={{ '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties}
            >
                {/* Borda animada com gradiente */}
                <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-3xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundSize: '400% 400%', animation: 'gradient-shift 8s ease infinite' }} />

                {/* Glow no hover seguindo o mouse */}
                <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                        background: 'radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(16, 185, 129, 0.15), transparent 40%)'
                    }}
                />

                {/* Card interno */}
                <div className="relative bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/20">
                    {/* Decoração de cantos */}
                    <div className="absolute top-4 left-4 w-3 h-3 border-l-2 border-t-2 border-emerald-500/50" />
                    <div className="absolute top-4 right-4 w-3 h-3 border-r-2 border-t-2 border-emerald-500/50" />
                    <div className="absolute bottom-4 left-4 w-3 h-3 border-l-2 border-b-2 border-emerald-500/50" />
                    <div className="absolute bottom-4 right-4 w-3 h-3 border-r-2 border-b-2 border-emerald-500/50" />

                    {/* Estado de sucesso */}
                    {success ? (
                        <div className="text-center space-y-6 py-4 animate-[fadeIn_0.5s_ease-out]">
                            {/* Ícone de sucesso com animação */}
                            <div className="relative inline-flex">
                                <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full animate-pulse" />
                                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-[bounceIn_0.5s_ease-out]" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-white">Email enviado!</h2>
                                <p className="text-zinc-400">
                                    Enviamos um link de recuperação para
                                </p>
                                <p className="text-emerald-400 font-medium">{email}</p>
                                <p className="text-zinc-500 text-sm mt-4">
                                    Verifique sua caixa de entrada e spam.
                                </p>
                            </div>

                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-300 hover:text-white hover:border-emerald-500/50 hover:bg-zinc-800 transition-all duration-300 group/link"
                            >
                                <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover/link:-translate-x-1" />
                                Voltar para o login
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                                    <KeyRound className="w-4 h-4 text-emerald-400" />
                                    <span className="text-emerald-400 text-sm font-medium">Recuperação</span>
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    Esqueceu a senha?
                                </h1>
                                <p className="text-zinc-400 text-sm">Digite seu email para receber o link de recuperação</p>
                            </div>

                            {/* Formulário */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Mensagem de erro */}
                                {error && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-[shake_0.5s_ease-in-out]">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <span className="font-medium">{error}</span>
                                    </div>
                                )}

                                {/* Campo Email */}
                                <div className="relative group/input">
                                    {/* Glow de foco */}
                                    <div className={`absolute -inset-px rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 blur transition-all duration-500 ${emailFocused ? 'opacity-50' : 'group-hover/input:opacity-25'}`} />

                                    <div className="relative">
                                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${emailFocused || email ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                            <Mail className={`w-5 h-5 transition-transform duration-300 ${emailFocused ? 'scale-110' : ''}`} />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onFocus={() => setEmailFocused(true)}
                                            onBlur={() => setEmailFocused(false)}
                                            className={`w-full h-14 pl-12 pr-4 bg-zinc-800/50 rounded-xl border text-white placeholder:text-zinc-500 transition-all duration-300 outline-none ${emailFocused
                                                ? 'border-emerald-500 bg-zinc-800/80 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                                : 'border-zinc-700 hover:border-zinc-600'
                                                }`}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Botão de Enviar */}
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="relative w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-base font-bold rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300 overflow-hidden group/btn"
                                >
                                    {/* Shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />

                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="relative z-10">Enviar Link</span>
                                            <Send className="relative z-10 ml-2 h-5 w-5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Footer - Link para voltar */}
                            <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-all duration-300 group/link"
                                >
                                    <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover/link:-translate-x-1" />
                                    Voltar para o login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* CSS para animações */}
            <style jsx>{`
                @keyframes gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes bounceIn {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
