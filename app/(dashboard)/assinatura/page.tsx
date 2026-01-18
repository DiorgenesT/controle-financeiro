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
            id: "anual",
            name: "Anual",
            price: "R$ 67,90",
            period: "/ano",
            description: "Para quem quer economizar",
            features: [
                "Acesso anual ao sistema",
                "Todas as funcionalidades",
                "Atualizações incluídas",
                "Suporte prioritário",
                "Sem taxas escondidas"
            ],
            popular: true,
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header title="Assinatura" />

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Current Status */}
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-none text-white shadow-xl">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Crown className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-white">Sua Assinatura</h3>
                                        <Badge className={isActive ? "bg-white/20 text-white hover:bg-white/30 border-none" : "bg-red-500 text-white border-none"}>
                                            {isActive ? "Ativa" : "Inativa"}
                                        </Badge>
                                    </div>
                                    <p className="text-white/80 mt-1">
                                        Olá, {user?.displayName?.split(" ")[0]}!
                                        {isActive ? " Seu plano está ativo." : " Renove seu plano para continuar usando."}
                                    </p>
                                </div>
                            </div>
                            {isActive && (
                                <div className="text-right">
                                    <div className="flex items-center gap-2 text-white">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="font-medium">Plano Ativo</span>
                                    </div>
                                    <p className="text-sm text-white/80 mt-1">
                                        Acesso completo a todos os recursos
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Plans */}
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-4">Planos Disponíveis</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {plans.map((plan) => (
                            <Card
                                key={plan.name}
                                className={`relative bg-card border-border overflow-hidden transition-all hover:border-emerald-500/50 hover:shadow-lg ${plan.popular ? "border-emerald-500 ring-1 ring-emerald-500" : ""
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm">
                                        POPULAR
                                    </div>
                                )}

                                <CardHeader className="pt-8">
                                    <CardTitle className="text-foreground">{plan.name}</CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        <span className="text-3xl font-bold text-foreground">
                                            {plan.price}
                                        </span>
                                        <span className="text-muted-foreground">{plan.period}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ul className="space-y-2">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-emerald-500" />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className={`w-full ${plan.popular
                                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                                            : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                                            }`}
                                    >
                                        {isActive ? "Plano Atual" : "Assinar"}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Help */}
                <div className="text-center">
                    <p className="text-muted-foreground">
                        Precisa de ajuda?{" "}
                        <a href="mailto:contato@tatudoemdia.com.br" className="text-emerald-500 hover:text-emerald-400 inline-flex items-center gap-1 cursor-pointer">
                            Fale conosco <ExternalLink className="w-3 h-3" />
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
