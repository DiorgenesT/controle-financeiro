"use client";

import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
    CreditCard,
    Check,
    Calendar,
    ExternalLink,
    Crown,
    CheckCircle
} from "lucide-react";

export default function AssinaturaPage() {
    const { user } = useAuth();

    const isActive = user?.subscriptionStatus === "active";

    const plans = [
        {
            name: "Mensal",
            price: 19.90,
            period: "/mês",
            popular: true,
            features: [
                "Transações ilimitadas",
                "Metas ilimitadas",
                "Relatórios avançados",
                "Exportação PDF/Excel",
                "Categorias personalizadas",
                "Suporte prioritário"
            ],
        },
        {
            name: "Anual",
            price: 14.90,
            period: "/mês",
            discount: "Economia de 25%",
            features: [
                "Tudo do plano Mensal",
                "Preço garantido por 1 ano",
                "2 meses grátis",
                "Acesso antecipado a novidades"
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-zinc-950">
            <Header title="Assinatura" />

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Current Status */}
                <Card className="bg-gradient-to-br from-emerald-900/30 to-zinc-900/50 border-emerald-800/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                    <Crown className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-white">Sua Assinatura</h3>
                                        <Badge className={isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                                            {isActive ? "Ativa" : "Inativa"}
                                        </Badge>
                                    </div>
                                    <p className="text-zinc-400 mt-1">
                                        Olá, {user?.displayName?.split(" ")[0]}!
                                        {isActive ? " Seu plano está ativo." : " Renove seu plano para continuar usando."}
                                    </p>
                                </div>
                            </div>
                            {isActive && (
                                <div className="text-right">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="font-medium">Plano Ativo</span>
                                    </div>
                                    <p className="text-sm text-zinc-400 mt-1">
                                        Acesso completo a todos os recursos
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Plans */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">Planos Disponíveis</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {plans.map((plan) => (
                            <Card
                                key={plan.name}
                                className={`relative bg-zinc-900/50 border-zinc-800 overflow-hidden transition-all hover:border-zinc-600 ${plan.popular ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : ""
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                        POPULAR
                                    </div>
                                )}
                                {plan.discount && (
                                    <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-500 to-amber-400 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                                        {plan.discount}
                                    </div>
                                )}
                                <CardHeader className="pt-8">
                                    <CardTitle className="text-white">{plan.name}</CardTitle>
                                    <CardDescription className="text-zinc-400">
                                        <span className="text-3xl font-bold text-white">
                                            R$ {plan.price.toFixed(2).replace(".", ",")}
                                        </span>
                                        <span className="text-zinc-500">{plan.period}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ul className="space-y-2">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-center gap-2 text-sm text-zinc-300">
                                                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className={`w-full ${plan.popular
                                                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                                                : "bg-zinc-800 hover:bg-zinc-700 text-white"
                                            }`}
                                    >
                                        {isActive ? "Plano Atual" : "Assinar"}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Payment Info */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-400" />
                            Método de Pagamento
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Gerencie suas formas de pagamento
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-dashed border-zinc-700">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 rounded bg-zinc-700 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-zinc-400" />
                                </div>
                                <div>
                                    <p className="text-zinc-400">Nenhum método de pagamento cadastrado</p>
                                    <p className="text-sm text-zinc-500">Adicione um cartão para renovar automaticamente</p>
                                </div>
                            </div>
                            <Button variant="outline" className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/20">
                                Adicionar Cartão
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Billing History */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-emerald-400" />
                            Histórico de Cobrança
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <p className="text-zinc-400">Nenhuma cobrança ainda</p>
                            <p className="text-sm text-zinc-500 mt-1">O histórico aparecerá aqui após sua primeira assinatura</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Help */}
                <div className="text-center">
                    <p className="text-zinc-400">
                        Precisa de ajuda?{" "}
                        <a href="#" className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
                            Fale conosco <ExternalLink className="w-3 h-3" />
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
