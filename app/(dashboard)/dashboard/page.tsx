"use client";

import { subMonths } from "date-fns";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionModal } from "@/components/TransactionModal";
import { ForecastCard } from "@/components/ForecastCard";
import { FinancialScoreCard } from "@/components/FinancialScoreCard";
import { SafeToSpendCard } from "@/components/SafeToSpendCard";
import { InsightsCarousel } from "@/components/InsightsCarousel";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    MoreHorizontal,
    FileText,
    CreditCard,
    Receipt,
    Smartphone,
    AlertTriangle,
    ChevronDown,
    Sun,
    Sunset,
    Moon,
    Sparkles,
    LayoutDashboard,
    PlayCircle,
    ChevronRight,
    Play,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useGoals } from "@/hooks/useGoals";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatTransactionDescription, cn } from "@/lib/utils";
import Link from "next/link";
import { OnboardingTour } from "@/components/OnboardingTour";
import { MarketTicker } from "@/components/MarketTicker";
import { AccountsTicker } from "@/components/AccountsTicker";
import { EconomicIndicatorsCard } from "@/components/EconomicIndicatorsCard";
import { FloatingAssistant } from "@/components/FloatingAssistant";
import { WeatherWidget } from "@/components/WeatherWidget";
import { MonthlyStories } from "@/components/MonthlyStories";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
};

export default function DashboardPage() {
    const { user } = useAuth();
    const { transactions, totalReceitas, totalDespesas, loading } = useTransactions();
    const { accounts, loading: loadingContas } = useAccounts();
    const { goals, loading: loadingGoals } = useGoals();
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [showModal, setShowModal] = useState(false);
    const [showStories, setShowStories] = useState(false);
    const [showTickers, setShowTickers] = useState(false);

    const saldoContas = accounts.reduce((acc, a) => acc + a.balance, 0);

    // Identificar contas vinculadas a metas
    const linkedAccountIds = new Set(goals.map(g => g.linkedAccountId).filter((id): id is string => !!id));

    // Logic for Monthly Stories Button (Only on the 1st of the month)
    const today = new Date();
    const isFirstDayOfMonth = today.getDate() === 1;
    const previousMonthDate = subMonths(today, 1);

    const getGreeting = () => {
        const hour = new Date().getHours();
        let text = "Boa noite";
        if (hour < 12) text = "Bom dia";
        else if (hour < 18) text = "Boa tarde";

        return { text, icon: <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" /> };
    };

    const { text: greetingText, icon: greetingIcon } = getGreeting();

    // Filtrar para mostrar apenas a primeira parcela de compras parceladas
    // (ou todas as transações que não são parcelas futuras)
    const recentTransactions = transactions
        .filter(t => {
            // Ignorar parcelas futuras
            if (t.installmentNumber && t.installmentNumber > 1) return false;
            // Ignorar cartão de crédito (só conta no pagamento da fatura)
            if (t.paymentMethod === "credit") return false;
            // Ignorar boleto pendente
            if (t.paymentMethod === "boleto" && t.boletoStatus === "pending") return false;
            return true;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Ordenar por data de lançamento
        .slice(0, 5);
    const economia = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas * 100) : 0;

    return (
        <div className="min-h-screen bg-background relative">
            <OnboardingTour />
            <Header title="Dashboard" />

            {/* Floating Assistant */}
            <FloatingAssistant />

            <TransactionModal open={showModal} onOpenChange={setShowModal} />

            <div className="p-2 md:p-6 space-y-3 md:space-y-6">
                {/* Monthly Stories Overlay */}
                {isFirstDayOfMonth && (
                    <MonthlyStories
                        isOpen={showStories}
                        onClose={() => setShowStories(false)}
                        referenceDate={previousMonthDate}
                    />
                )}

                {/* Greeting */}
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-card p-4 md:p-8 shadow-sm group">
                    {/* Background Decorative Elements - Simplified */}
                    <div className="absolute -right-10 -top-10 w-32 md:w-40 h-32 md:h-40 bg-emerald-500/5 rounded-full blur-3xl" />

                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* 1. Greeting (Left) */}
                        <div className="w-full md:w-auto flex items-center justify-between md:justify-start">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg md:text-3xl font-bold tracking-tight text-foreground">
                                    {greetingText},
                                    <span className="inline ml-1 md:ml-2 text-emerald-500">
                                        {user?.displayName?.split(" ")[0] || "Usuário"}
                                    </span>
                                </h2>
                                <WeatherWidget />
                            </div>
                        </div>

                        {/* 2. Monthly Stories Button (CENTER - Rounded & Animated - Only visible on 1st of month) */}
                        {isFirstDayOfMonth && (
                            <>
                                <div className="relative z-10 hidden md:block group/story">
                                    <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full opacity-60 animate-pulse group-hover/story:opacity-90 transition-opacity duration-500" />
                                    <Button
                                        onClick={() => setShowStories(true)}
                                        className="relative h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 rounded-full pl-3 pr-8 shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(20,184,166,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group/btn overflow-hidden animate-heartbeat"
                                    >
                                        {/* Continuous Shimmer Effect */}
                                        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer pointer-events-none" />

                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-lg group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-all duration-300 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-emerald-100/30 animate-pulse rounded-full" />
                                                <Play className="w-5 h-5 ml-0.5 fill-current relative z-10" />
                                            </div>
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="text-[10px] font-extrabold text-emerald-100 uppercase tracking-widest leading-none drop-shadow-sm animate-pulse">Destaque</span>
                                                <span className="text-sm font-bold text-white leading-none drop-shadow-md">RESUMO DO MÊS</span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-white absolute right-1 opacity-60 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-300" />
                                        </div>
                                    </Button>
                                </div>

                                {/* Mobile-only Story Button (Constant Shimmer) */}
                                <div className="md:hidden w-full relative overflow-hidden rounded-full shadow-lg shadow-emerald-500/20">
                                    <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full animate-pulse" />
                                    <Button
                                        onClick={() => setShowStories(true)}
                                        className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:from-emerald-500 hover:to-teal-500 border-0 rounded-full relative z-10 overflow-hidden group/mobile animate-heartbeat shadow-lg shadow-emerald-500/30"
                                    >
                                        {/* Continuous Shimmer Effect Mobile */}
                                        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg] animate-shimmer pointer-events-none" />

                                        <Play className="w-4 h-4 mr-2 fill-current text-white animate-pulse" />
                                        <span className="drop-shadow-sm">VER RESUMO DO MÊS</span>
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* 3. New Transaction (Right) */}
                        <Button
                            id="dashboard-new-transaction-btn"
                            onClick={() => setShowModal(true)}
                            className="flex w-full md:w-auto h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] justify-center"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Nova Transação
                        </Button>
                        {/* Mobile Floating Action Button is usually handled by FloatingAssistant, but keeping this logical flow */}
                    </div>
                </div>



                {/* KPIs — Saldo, Receitas, Despesas, Insights */}
                <div className="grid gap-2 md:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
                    <Card id="dashboard-balance-card" className="col-span-2 md:col-span-1 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-800 border-0 shadow-none ring-1 ring-white/10 overflow-hidden relative text-white group">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 relative p-3 md:p-4">
                            <div className="space-y-0.5">
                                <CardTitle className="text-[10px] md:text-base font-medium text-white/80">
                                    Saldo Total
                                </CardTitle>
                                {loading || loadingContas ? (
                                    <Skeleton className="h-6 md:h-9 w-20 md:w-32 bg-white/20" />
                                ) : (
                                    <div className="text-base md:text-3xl font-bold text-white">
                                        {formatCurrency(saldoContas)}
                                    </div>
                                )}
                            </div>
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors duration-500">
                                <Wallet className="w-4 h-4 md:w-6 md:h-6 text-white group-hover:scale-125 group-hover:-rotate-12 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative pt-0 p-3 md:p-4 pb-3 md:pb-4 overflow-hidden">
                            {!loading && !loadingContas && !loadingGoals && (
                                <AccountsTicker accounts={accounts} linkedAccountIds={linkedAccountIds} />
                            )}
                        </CardContent>
                    </Card>

                    <Card id="dashboard-receitas-card" className="bg-gradient-to-br from-green-600 via-green-500 to-green-800 border-0 shadow-none ring-1 ring-white/10 overflow-hidden relative text-white group">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 relative p-3 md:p-4">
                            <CardTitle className="text-[10px] md:text-base font-medium text-white/80">
                                Receitas
                            </CardTitle>
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors duration-500">
                                <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-white group-hover:scale-125 group-hover:-rotate-12 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative p-3 md:p-4 pt-0">
                            {loading ? (
                                <Skeleton className="h-6 md:h-9 w-20 md:w-32 bg-white/20" />
                            ) : (
                                <>
                                    <div className="text-base md:text-3xl font-bold text-white">
                                        {formatCurrency(totalReceitas)}
                                    </div>
                                    <p className="text-[8px] md:text-xs text-white/80 flex items-center mt-0.5">
                                        <ArrowUpRight className="w-2.5 h-2.5 md:w-4 md:h-4 mr-1" />
                                        Este mês
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card id="dashboard-despesas-card" className="bg-gradient-to-br from-red-600 via-red-500 to-red-800 border-0 shadow-none ring-1 ring-white/10 overflow-hidden relative text-white group">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 relative p-3 md:p-4">
                            <CardTitle className="text-[10px] md:text-base font-medium text-white/80">
                                Despesas
                            </CardTitle>
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors duration-500">
                                <TrendingDown className="w-4 h-4 md:w-6 md:h-6 text-white group-hover:scale-125 group-hover:-rotate-12 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative p-3 md:p-4 pt-0">
                            {loading ? (
                                <Skeleton className="h-6 md:h-9 w-20 md:w-32 bg-white/20" />
                            ) : (
                                <>
                                    <div className="text-base md:text-3xl font-bold text-white">
                                        {formatCurrency(totalDespesas)}
                                    </div>
                                    <p className="text-[8px] md:text-xs text-white/80 flex items-center mt-0.5">
                                        <ArrowDownRight className="w-2.5 h-2.5 md:w-4 md:h-4 mr-1" />
                                        Este mês
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <div id="dashboard-insights-carousel" className="h-full col-span-2 md:col-span-1">
                        <InsightsCarousel
                            totalReceitas={totalReceitas}
                            totalDespesas={totalDespesas}
                            accounts={accounts}
                            goals={goals}
                            loading={loading || loadingContas || loadingGoals}
                        />
                    </div>
                </div>

                {/* Cards de análise */}
                <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4 items-start w-full min-w-0">
                    {/* 1. Transações Recentes (Compacto) */}
                    <Card className="h-full flex flex-col overflow-hidden min-w-0 w-full border border-blue-500/40 dark:border-white/10 bg-gradient-to-b from-card to-muted/20 shadow-[0_0_20px_-5px_rgba(59,130,246,0.1)] hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.2)] transition-all duration-300 group relative">
                        {/* Top Glow Line */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

                        <CardHeader className="flex flex-row items-center justify-between pb-0 pt-3 px-3 md:p-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full" />
                                    <div className="relative p-2 rounded-xl bg-card border border-blue-100/10 shadow-sm ring-1 ring-blue-500/10 group-hover:border-blue-500/30 transition-colors duration-500">
                                        <Receipt className="w-4 h-4 text-blue-500 group-hover:scale-125 group-hover:rotate-12 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
                                    </div>
                                </div>
                                <div>
                                    <CardTitle className="text-[10px] md:text-sm font-medium text-foreground tracking-tight">
                                        Transações
                                    </CardTitle>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                        Últimas atividades
                                    </p>
                                </div>
                            </div>
                            <Link href="/transacoes" className="group flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-blue-500 transition-colors bg-muted/50 px-2 py-1 rounded-full border border-border/50 hover:bg-blue-500/10 hover:border-blue-500/20">
                                Ver tudo
                                <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </Link>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-3 md:p-4 pt-2 relative z-10">
                            {loading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-8 w-full bg-muted" />
                                    ))}
                                </div>
                            ) : recentTransactions.length === 0 ? (
                                <div className="text-center py-4 md:py-6">
                                    <FileText className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground mx-auto mb-1 md:mb-2" />
                                    <p className="text-[10px] md:text-xs text-muted-foreground">Sem transações</p>
                                    <Button
                                        variant="link"
                                        onClick={() => setShowModal(true)}
                                        className="h-auto p-0 text-emerald-500 text-[10px] md:text-xs"
                                    >
                                        Adicionar
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-1 overflow-y-auto custom-scrollbar pr-1 max-h-[180px] md:max-h-[280px]">
                                    {transactions
                                        .filter(t => {
                                            if (t.installmentNumber && t.installmentNumber > 1) return false;
                                            if (t.paymentMethod === "credit") return false;
                                            if (t.paymentMethod === "boleto" && t.boletoStatus === "pending") return false;
                                            return true;
                                        })
                                        .slice(0, 5) // Keep 5 for desktop, hide last 2 on mobile via CSS
                                        .map((transaction, index) => {
                                            const isReceita = transaction.type === "receita";
                                            // Hide items > 3 on mobile
                                            const mobileHiddenClass = index >= 3 ? "hidden md:flex" : "flex";

                                            return (
                                                <div
                                                    key={transaction.id}
                                                    className={`${mobileHiddenClass} items-center justify-between py-1 px-1.5 rounded-md hover:bg-muted/50 transition-colors group`}
                                                >
                                                    <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                                                        <div
                                                            className={`w-4 h-4 md:w-5 md:h-5 rounded-[4px] flex items-center justify-center shrink-0 ${isReceita
                                                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                                                                : 'bg-gradient-to-br from-red-500 to-red-600'
                                                                }`}
                                                        >
                                                            {isReceita ? (
                                                                <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                                            ) : (
                                                                <ArrowDownRight className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] md:text-[11px] font-medium text-foreground truncate">
                                                            {formatTransactionDescription(transaction, accounts)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`text-[10px] md:text-[11px] font-bold ${isReceita ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            {isReceita ? "+" : "-"}
                                                            {formatCurrency(transaction.amount)}
                                                        </span>
                                                        <span className="text-[9px] md:text-[10px] text-muted-foreground w-[30px] text-right">
                                                            {formatDate(transaction.date).slice(0, 5)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 2. Score de Saúde Financeira */}
                    <div id="dashboard-score-card" className="h-full">
                        <FinancialScoreCard />
                    </div>

                    {/* 3. Previsão */}
                    <div id="dashboard-forecast-card" className="h-full">
                        <ForecastCard />
                    </div>

                    {/* 4. Seguro Gastar Hoje */}
                    <div id="dashboard-safe-spend-card" className="h-full">
                        <SafeToSpendCard />
                    </div>
                </div>

                {/* Mercado — colapsável, no rodapé para não interromper o fluxo principal */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 items-start">
                    <div id="dashboard-market-ticker" className="h-full">
                        <MarketTicker
                            isOpen={isDesktop ? showTickers : undefined}
                            onToggle={isDesktop ? () => setShowTickers(!showTickers) : undefined}
                        />
                    </div>

                    <div id="dashboard-ticker-toggle" className="hidden md:flex flex-col items-center justify-start pt-4 h-full z-10">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTickers(!showTickers)}
                            className={cn(
                                "rounded-full w-6 h-6 p-0 border border-border shadow-sm hover:bg-accent hover:text-accent-foreground transition-all duration-300",
                                !showTickers && "bg-primary/10 text-primary border-primary/20"
                            )}
                        >
                            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-500", showTickers && "rotate-180")} />
                        </Button>
                    </div>

                    <div id="dashboard-economic-indicators" className="h-full">
                        <EconomicIndicatorsCard
                            isOpen={isDesktop ? showTickers : undefined}
                            onToggle={isDesktop ? () => setShowTickers(!showTickers) : undefined}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
