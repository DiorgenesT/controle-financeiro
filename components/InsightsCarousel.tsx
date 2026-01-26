"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Account, Goal } from "@/types";
import { useRecurring } from "@/hooks/useRecurring";
import {
    Target,
    TrendingUp,
    Shield,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InsightsCarouselProps {
    totalReceitas: number;
    totalDespesas: number;
    accounts: Account[];
    goals: Goal[];
    loading?: boolean;
}

export function InsightsCarousel({
    totalReceitas,
    totalDespesas,
    accounts,
    goals,
    loading = false
}: InsightsCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { recurring, loading: loadingRecurring } = useRecurring();

    // Calcular métricas
    const economia = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas * 100) : 0;

    const saldoReserva = accounts
        .filter(a => a.type === 'emergency')
        .reduce((acc, a) => acc + a.balance, 0);

    // Estimativa de meses de cobertura (usando despesas do mês atual como base)
    // Se despesas forem 0, evita divisão por zero
    const mesesCobertura = totalDespesas > 0 ? saldoReserva / totalDespesas : 0;

    const totalMetas = goals.filter(g => g.status === 'em_progresso').reduce((acc, g) => acc + g.targetAmount, 0);
    const atualMetas = goals.filter(g => g.status === 'em_progresso').reduce((acc, g) => acc + g.currentAmount, 0);
    const progressoMetas = totalMetas > 0 ? (atualMetas / totalMetas) * 100 : 0;

    // Insights de Saúde Financeira
    const despesasFixas = recurring
        .filter(r => r.type === 'despesa' && r.active)
        .reduce((acc, r) => acc + r.amount, 0);

    const despesasVariaveis = Math.max(0, totalDespesas - despesasFixas);

    const receitaFixa = recurring
        .filter(r => r.type === 'receita' && r.active)
        .reduce((acc, r) => acc + r.amount, 0);

    const getHealthInsight = () => {
        if (totalReceitas === 0) return {
            status: "Atenção",
            message: "Sem receitas registradas este mês.",
            color: "text-amber-400",
            icon: AlertTriangle
        };

        if (totalDespesas > totalReceitas) return {
            status: "Cuidado",
            message: "Despesas superam receitas. Revise gastos variáveis.",
            color: "text-red-400",
            icon: ArrowDownRight
        };

        if (economia >= 20) return {
            status: "Ótimo",
            message: "Você está poupando mais de 20% da sua renda!",
            color: "text-emerald-400",
            icon: CheckCircle2
        };

        if (despesasFixas > totalReceitas * 0.6) return {
            status: "Alerta",
            message: "Custos fixos altos (>60% da renda).",
            color: "text-amber-400",
            icon: AlertTriangle
        };

        return {
            status: "Estável",
            message: "Finanças equilibradas. Continue assim!",
            color: "text-blue-400",
            icon: Activity
        };
    };

    const health = getHealthInsight();

    const slides = [
        {
            id: "economia",
            title: "Economia Mensal",
            icon: TrendingUp,
            iconColor: "text-white",
            bgIcon: "bg-white/20",
            fullGradient: "bg-gradient-to-br from-purple-600 via-purple-500 to-purple-800",
            content: (
                <>
                    <div className="text-3xl font-bold text-white">
                        {economia.toFixed(1)}%
                    </div>
                    <p className="text-xs md:text-sm text-white/80 flex items-center mt-1">
                        <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        Da receita mensal
                    </p>
                </>
            )
        },
        {
            id: "reserva",
            title: "Reserva de Emergência",
            icon: Shield,
            iconColor: "text-white",
            bgIcon: "bg-white/20",
            fullGradient: "bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-800",
            content: (
                <>
                    <div className="text-3xl font-bold text-white">
                        {mesesCobertura.toFixed(1)} <span className="text-base font-normal text-white/80">meses</span>
                    </div>
                    <p className="text-xs md:text-sm text-white/80 flex items-center mt-1">
                        <Shield className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        Cobertura atual
                    </p>
                </>
            )
        },
        {
            id: "metas",
            title: "Metas em Andamento",
            icon: Target,
            iconColor: "text-white",
            bgIcon: "bg-white/20",
            fullGradient: "bg-gradient-to-br from-blue-600 via-blue-500 to-blue-800",
            content: (
                <>
                    <div className="text-3xl font-bold text-white">
                        {progressoMetas.toFixed(0)}%
                    </div>
                    <p className="text-xs md:text-sm text-white/80 flex items-center mt-1">
                        <Target className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        Conclusão geral
                    </p>
                </>
            )
        },
        {
            id: "saude",
            title: "Saúde Financeira",
            icon: Activity,
            iconColor: "text-white",
            bgIcon: "bg-white/20",
            fullGradient: `bg-gradient-to-br from-${health.color.split('-')[1]}-600 via-${health.color.split('-')[1]}-500 to-${health.color.split('-')[1]}-800`,
            content: (
                <>
                    <div className="text-xl font-bold text-white">
                        {health.status}
                    </div>
                    <p className="text-xs md:text-sm text-white/80 mt-1 leading-tight">
                        {health.message}
                    </p>
                </>
            )
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 5000); // 5 segundos por slide

        return () => clearInterval(timer);
    }, [slides.length]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const currentSlide = slides[currentIndex];
    const Icon = currentSlide.icon;

    return (
        <Card className={`${currentSlide.fullGradient} border-0 shadow-none ring-1 ring-white/10 overflow-hidden relative h-full transition-all duration-500 group`}>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 relative p-3 md:p-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${currentSlide.bgIcon} flex items-center justify-center transition-colors duration-500`}>
                        <Icon className={`w-5 h-5 ${currentSlide.iconColor}`} />
                    </div>
                    <CardTitle className="text-xs md:text-base font-medium text-white/90">
                        {currentSlide.title}
                    </CardTitle>
                </div>
                <div className="flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={prevSlide}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={nextSlide}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="relative p-3 md:p-4 pt-0 pb-3 md:pb-4">
                {loading || loadingRecurring ? (
                    <Skeleton className="h-9 w-40 bg-white/20" />
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-[50px] flex flex-col justify-center">
                        {currentSlide.content}
                    </div>
                )}

                {/* Indicators */}
                <div className="flex gap-1 mt-1 justify-center">
                    {slides.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-3 bg-white" : "w-1 bg-white/30"
                                }`}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
