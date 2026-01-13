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
    CheckCircle2
} from "lucide-react";

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
            iconColor: "text-purple-400",
            bgIcon: "bg-purple-500/20",
            gradient: "from-purple-500/10",
            content: (
                <>
                    <div className="text-2xl font-bold text-white">
                        {economia.toFixed(1)}%
                    </div>
                    <p className="text-xs text-purple-400 flex items-center mt-1">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        Da receita mensal
                    </p>
                </>
            )
        },
        {
            id: "reserva",
            title: "Reserva de Emergência",
            icon: Shield,
            iconColor: "text-emerald-400",
            bgIcon: "bg-emerald-500/20",
            gradient: "from-emerald-500/10",
            content: (
                <>
                    <div className="text-2xl font-bold text-white">
                        {mesesCobertura.toFixed(1)} <span className="text-sm font-normal text-zinc-400">meses</span>
                    </div>
                    <p className="text-xs text-emerald-400 flex items-center mt-1">
                        <Shield className="w-3 h-3 mr-1" />
                        Cobertura atual
                    </p>
                </>
            )
        },
        {
            id: "metas",
            title: "Metas em Andamento",
            icon: Target,
            iconColor: "text-blue-400",
            bgIcon: "bg-blue-500/20",
            gradient: "from-blue-500/10",
            content: (
                <>
                    <div className="text-2xl font-bold text-white">
                        {progressoMetas.toFixed(0)}%
                    </div>
                    <p className="text-xs text-blue-400 flex items-center mt-1">
                        <Target className="w-3 h-3 mr-1" />
                        Conclusão geral
                    </p>
                </>
            )
        },
        {
            id: "saude",
            title: "Saúde Financeira",
            icon: Activity,
            iconColor: health.color,
            bgIcon: `bg-${health.color.split('-')[1]}-500/20`, // Hacky but works for standard tailwind colors if configured, otherwise fallback might be needed. Better to map explicitly.
            gradient: `from-${health.color.split('-')[1]}-500/10`,
            content: (
                <>
                    <div className={`text-lg font-bold ${health.color}`}>
                        {health.status}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-tight">
                        {health.message}
                    </p>
                </>
            )
        }
    ];

    // Fix background color mapping for dynamic classes
    const getBgColor = (colorClass: string) => {
        if (colorClass.includes("emerald")) return "bg-emerald-500/20";
        if (colorClass.includes("amber")) return "bg-amber-500/20";
        if (colorClass.includes("red")) return "bg-red-500/20";
        if (colorClass.includes("blue")) return "bg-blue-500/20";
        return "bg-purple-500/20";
    };

    const getGradient = (colorClass: string) => {
        if (colorClass.includes("emerald")) return "from-emerald-500/10";
        if (colorClass.includes("amber")) return "from-amber-500/10";
        if (colorClass.includes("red")) return "from-red-500/10";
        if (colorClass.includes("blue")) return "from-blue-500/10";
        return "from-purple-500/10";
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 5000); // 5 segundos por slide

        return () => clearInterval(timer);
    }, [slides.length]);

    const currentSlide = slides[currentIndex];
    const Icon = currentSlide.icon;

    // Override dynamic classes for the health slide to ensure they work
    const bgIconClass = currentSlide.id === 'saude' ? getBgColor(health.color) : currentSlide.bgIcon;
    const gradientClass = currentSlide.id === 'saude' ? getGradient(health.color) : currentSlide.gradient;

    return (
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800 overflow-hidden relative h-full transition-all duration-500">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} to-transparent transition-all duration-500`} />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-zinc-400">
                    {currentSlide.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-lg ${bgIconClass} flex items-center justify-center transition-colors duration-500`}>
                    <Icon className={`w-5 h-5 ${currentSlide.iconColor}`} />
                </div>
            </CardHeader>

            <CardContent className="relative">
                {loading || loadingRecurring ? (
                    <Skeleton className="h-8 w-32 bg-zinc-800" />
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        {currentSlide.content}
                    </div>
                )}

                {/* Indicators */}
                <div className="flex gap-1 mt-4 justify-center">
                    {slides.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? `w-4 ${currentSlide.iconColor.replace('text-', 'bg-')}` : "w-1 bg-zinc-800"
                                }`}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
