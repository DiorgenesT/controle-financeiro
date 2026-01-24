"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { confirmResetPassword } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft } from "lucide-react";

function NovaSenhaForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const oobCode = searchParams.get("oobCode");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!oobCode) {
            setError("Código de verificação inválido ou expirado.");
        }
    }, [oobCode]);

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
        if (!/[A-Z]/.test(password)) return "A senha deve conter pelo menos uma letra maiúscula.";
        if (!/[a-z]/.test(password)) return "A senha deve conter pelo menos uma letra minúscula.";
        if (!/[0-9]/.test(password)) return "A senha deve conter pelo menos um número.";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "A senha deve conter pelo menos um caractere especial.";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!oobCode) {
            setError("Código de verificação inválido.");
            return;
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        setLoading(true);

        try {
            await confirmResetPassword(oobCode, newPassword);
            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/invalid-action-code") {
                setError("O link de recuperação é inválido ou já foi utilizado.");
            } else if (err.code === "auth/expired-action-code") {
                setError("O link de recuperação expirou.");
            } else if (err.code === "auth/weak-password") {
                setError("A senha é muito fraca.");
            } else {
                setError("Erro ao redefinir senha. Tente solicitar um novo link.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl animate-[fadeIn_0.5s_ease-out]">
                <CardContent className="pt-6">
                    <div className="text-center space-y-6 py-4">
                        <div className="relative inline-flex">
                            <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full animate-pulse" />
                            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-[bounceIn_0.5s_ease-out]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Senha Redefinida!</h2>
                            <p className="text-zinc-400">
                                Sua senha foi alterada com sucesso.
                            </p>
                            <p className="text-zinc-500 text-sm mt-4">
                                Redirecionando para o login...
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push("/login")}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                        >
                            Ir para Login agora
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold text-white">Nova Senha</CardTitle>
                <CardDescription className="text-zinc-400">
                    Crie uma nova senha segura para sua conta
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-[shake_0.5s_ease-in-out]">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="newPassword" className={error && error.includes("senha") ? "text-red-400" : "text-zinc-300"}>Nova Senha</Label>
                        <div className="relative group/input">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/input:text-emerald-500 transition-colors" />
                            <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="pl-10 pr-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className={error && error.includes("coincidem") ? "text-red-400" : "text-zinc-300"}>Confirmar Nova Senha</Label>
                        <div className="relative group/input">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/input:text-emerald-500 transition-colors" />
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10 pr-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="text-xs text-zinc-500 space-y-1 bg-zinc-800/30 p-3 rounded-lg border border-zinc-800">
                        <p className="font-medium text-zinc-400 mb-2">A senha deve conter:</p>
                        <ul className="space-y-1">
                            <li className={`flex items-center gap-2 ${newPassword.length >= 8 ? "text-emerald-400" : ""}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? "bg-emerald-500" : "bg-zinc-600"}`} />
                                Pelo menos 8 caracteres
                            </li>
                            <li className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? "text-emerald-400" : ""}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(newPassword) ? "bg-emerald-500" : "bg-zinc-600"}`} />
                                Uma letra maiúscula
                            </li>
                            <li className={`flex items-center gap-2 ${/[a-z]/.test(newPassword) ? "text-emerald-400" : ""}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(newPassword) ? "bg-emerald-500" : "bg-zinc-600"}`} />
                                Uma letra minúscula
                            </li>
                            <li className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? "text-emerald-400" : ""}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(newPassword) ? "bg-emerald-500" : "bg-zinc-600"}`} />
                                Um número
                            </li>
                            <li className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "text-emerald-400" : ""}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "bg-emerald-500" : "bg-zinc-600"}`} />
                                Um caractere especial
                            </li>
                        </ul>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || !oobCode}
                        className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all duration-300"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Redefinindo...
                            </>
                        ) : (
                            "Redefinir Senha"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function NovaSenhaPage() {
    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-md auth-page-enter">
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

            <Suspense fallback={
                <Card className="w-full border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                    <CardContent className="pt-6 flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    </CardContent>
                </Card>
            }>
                <NovaSenhaForm />
            </Suspense>

            <div className="text-center">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-all duration-300 group/link"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover/link:-translate-x-1" />
                    Voltar para o login
                </Link>
            </div>
        </div>
    );
}
