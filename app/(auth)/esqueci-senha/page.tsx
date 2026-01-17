"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { resetPassword } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function EsqueciSenhaPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error && 'code' in err) {
                const firebaseError = err as { code: string };
                switch (firebaseError.code) {
                    case "auth/user-not-found":
                        setError("Email não encontrado em nossa base.");
                        break;
                    case "auth/invalid-email":
                        setError("Email inválido.");
                        break;
                    default:
                        setError("Erro ao enviar email. Tente novamente.");
                }
            } else {
                setError("Erro ao enviar email. Tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
                <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Email enviado!</h2>
                        <p className="text-zinc-400">
                            Enviamos um link de recuperação para <span className="text-emerald-400">{email}</span>
                        </p>
                        <p className="text-zinc-500 text-sm">
                            Verifique sua caixa de entrada e spam.
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center text-emerald-400 hover:text-emerald-300 mt-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar para o login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

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
            <Card className="w-full border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-white">Recuperar Senha</CardTitle>
                    <CardDescription className="text-zinc-400">
                        Digite seu email para receber o link de recuperação
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
                            <Label htmlFor="email" className="text-zinc-300">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                "Enviar Link de Recuperação"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-zinc-800 pt-6">
                    <Link
                        href="/login"
                        className="text-zinc-400 hover:text-white text-sm flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para o login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
