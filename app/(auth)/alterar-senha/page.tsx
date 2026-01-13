"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { changePassword, DEFAULT_PASSWORD } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function AlterarSenhaPage() {
    const router = useRouter();
    const { user, refreshUser, loading: authLoading } = useAuth();
    const [currentPassword, setCurrentPassword] = useState(DEFAULT_PASSWORD);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return "A senha deve ter pelo menos 8 caracteres.";
        }
        if (!/[A-Z]/.test(password)) {
            return "A senha deve conter pelo menos uma letra maiúscula.";
        }
        if (!/[a-z]/.test(password)) {
            return "A senha deve conter pelo menos uma letra minúscula.";
        }
        if (!/[0-9]/.test(password)) {
            return "A senha deve conter pelo menos um número.";
        }
        if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
            return "A senha deve conter pelo menos um caractere especial.";
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validações
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        if (newPassword === currentPassword) {
            setError("A nova senha deve ser diferente da senha atual.");
            return;
        }

        setLoading(true);

        try {
            await changePassword(currentPassword, newPassword);
            await refreshUser();
            setSuccess(true);
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error && 'code' in err) {
                const firebaseError = err as { code: string };
                switch (firebaseError.code) {
                    case "auth/wrong-password":
                        setError("Senha atual incorreta.");
                        break;
                    case "auth/weak-password":
                        setError("A nova senha é muito fraca.");
                        break;
                    default:
                        setError("Erro ao alterar senha. Tente novamente.");
                }
            } else {
                setError("Erro ao alterar senha. Tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (success) {
        return (
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
                <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Senha alterada com sucesso!</h2>
                        <p className="text-zinc-400">
                            Redirecionando para o dashboard...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-white">Alterar Senha</CardTitle>
                <CardDescription className="text-zinc-400">
                    Por segurança, altere sua senha padrão
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                        <p>Você está usando a senha temporária. Por segurança, crie uma nova senha.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-zinc-300">Senha Atual</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-zinc-300">Nova Senha</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="pl-10 pr-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-zinc-300">Confirmar Nova Senha</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10 pr-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="text-xs text-zinc-500 space-y-1">
                        <p>A senha deve conter:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            <li className={newPassword.length >= 8 ? "text-emerald-400" : ""}>
                                Pelo menos 8 caracteres
                            </li>
                            <li className={/[A-Z]/.test(newPassword) ? "text-emerald-400" : ""}>
                                Uma letra maiúscula
                            </li>
                            <li className={/[a-z]/.test(newPassword) ? "text-emerald-400" : ""}>
                                Uma letra minúscula
                            </li>
                            <li className={/[0-9]/.test(newPassword) ? "text-emerald-400" : ""}>
                                Um número
                            </li>
                            <li className={/[!@#$%^&*(),.?\":{}|<>]/.test(newPassword) ? "text-emerald-400" : ""}>
                                Um caractere especial
                            </li>
                        </ul>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Alterando...
                            </>
                        ) : (
                            "Alterar Senha"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
