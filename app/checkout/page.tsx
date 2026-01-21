"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function CheckoutPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [cpf, setCpf] = useState("");
    const [phone, setPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("PIX");
    const [loading, setLoading] = useState(false);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, cpf, phone, paymentMethod }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(`Erro: ${data.details || data.error || "Erro desconhecido"}`);
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert("Erro de conexão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            <header className="bg-white border-b border-zinc-200 py-4">
                <div className="container mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">T</span>
                        </div>
                        <span className="font-bold text-xl text-zinc-800">Tudo Em Dia</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Lock className="w-4 h-4" />
                        Ambiente Seguro
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-zinc-100">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Finalizar Assinatura</h1>
                        <p className="text-zinc-500">Preencha seus dados para criar sua conta e acessar o pagamento.</p>
                    </div>

                    <form onSubmit={handleCheckout} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">Nome Completo</label>
                            <input
                                type="text"
                                id="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                placeholder="Seu nome completo"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">E-mail</label>
                            <input
                                type="email"
                                id="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="cpf" className="block text-sm font-medium text-zinc-700 mb-1">CPF</label>
                            <input
                                type="text"
                                id="cpf"
                                required
                                value={cpf}
                                onChange={(e) => setCpf(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                placeholder="000.000.000-00"
                            />
                        </div>

                        <div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 mb-1">Celular</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>

                            <div className="mt-4"> {/* Added margin top for spacing */}
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Forma de Pagamento</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("PIX")}
                                        className={`px-4 py-3 rounded-xl border font-medium transition-all ${paymentMethod === "PIX"
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                                            : "border-zinc-200 hover:border-emerald-200 hover:bg-zinc-50 text-zinc-600"
                                            }`}
                                    >
                                        Pix
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("CREDIT_CARD")}
                                        className={`px-4 py-3 rounded-xl border font-medium transition-all ${paymentMethod === "CREDIT_CARD"
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                                            : "border-zinc-200 hover:border-emerald-200 hover:bg-zinc-50 text-zinc-600"
                                            }`}
                                    >
                                        Cartão
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("BOLETO")}
                                        className={`px-4 py-3 rounded-xl border font-medium transition-all ${paymentMethod === "BOLETO"
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                                            : "border-zinc-200 hover:border-emerald-200 hover:bg-zinc-50 text-zinc-600"
                                            }`}
                                    >
                                        Boleto
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all mt-6"
                        >
                            {loading ? "Processando..." : "Ir para Pagamento"}
                            {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
                        </Button>
                    </form>

                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Seus dados estão protegidos</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
