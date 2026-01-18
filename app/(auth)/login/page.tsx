"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user && !authLoading) {
            router.push("/dashboard");
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signIn(email, password);
            // Redirecionamento é tratado pelo useEffect
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error && 'code' in err) {
                const firebaseError = err as { code: string };
                switch (firebaseError.code) {
                    case "auth/user-not-found":
                        setError("Usuário não encontrado.");
                        break;
                    case "auth/wrong-password":
                        setError("Senha incorreta.");
                        break;
                    case "auth/invalid-email":
                        setError("Email inválido.");
                        break;
                    case "auth/invalid-credential":
                        setError("Email ou senha incorretos.");
                        break;
                    default:
                        setError("Erro ao fazer login. Tente novamente.");
                }
            } else {
                setError("Erro ao fazer login. Tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
            <div className="relative w-64 h-24">
                <Image
                    src="/logo-new.png"
                    alt="Tudo Em Dia"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
            <p className="text-muted-foreground text-lg -mt-6 mb-2">Controle financeiro inteligente</p>
            <Card className="w-full border-border bg-card backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-foreground">Entrar</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Acesse sua conta para gerenciar suas finanças
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

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-emerald-500/20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-muted-foreground">Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-emerald-500/20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <Link
                                href="/esqueci-senha"
                                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                Esqueceu a senha?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border pt-6">
                    <p className="text-muted-foreground text-sm text-center">
                        Suas credenciais são enviadas após a compra do plano.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
