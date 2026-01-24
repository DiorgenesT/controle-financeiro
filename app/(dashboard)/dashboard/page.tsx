"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionModal } from "@/components/TransactionModal";
import { ForecastCard } from "@/components/ForecastCard";
import { SmartInsightsCard } from "@/components/SmartInsightsCard";
import { UpcomingBillsCard } from "@/components/UpcomingBillsCard";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useGoals } from "@/hooks/useGoals";
import { formatTransactionDescription } from "@/lib/utils";
import Link from "next/link";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
};

import { OnboardingTour } from "@/components/OnboardingTour";
import { MarketTicker } from "@/components/MarketTicker";

export default function DashboardPage() {
    const { user } = useAuth();
    const { transactions, totalReceitas, totalDespesas, loading } = useTransactions();
    const { accounts, loading: loadingContas } = useAccounts();
    const { goals, loading: loadingGoals } = useGoals();
    const [showModal, setShowModal] = useState(false);

    const saldoContas = accounts.reduce((acc, a) => acc + a.balance, 0);

    // Identificar contas vinculadas a metas
    const linkedAccountIds = new Set(goals.map(g => g.linkedAccountId).filter(id => id));

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bom dia";
        if (hour < 18) return "Boa tarde";
        return "Boa noite";
    };

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
        <div className="min-h-screen bg-background">
            <OnboardingTour />
            <Header title="Dashboard" />

            <TransactionModal open={showModal} onOpenChange={setShowModal} />

            <div className="p-2 md:p-6 space-y-3 md:space-y-6">
                {/* Greeting */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
                    <div>
                        <h2 className="text-lg md:text-2xl font-bold text-foreground">
                            {greeting()}, {user?.displayName?.split(" ")[0] || "Usuário"}!
                        </h2>
                        <p className="text-[10px] md:text-base text-muted-foreground mt-0.5">
                            Aqui está um resumo das suas finanças
                        </p>
                    </div>
                    <Button
                        id="dashboard-new-transaction-btn"
                        onClick={() => setShowModal(true)}
                        className="w-full md:w-auto h-9 md:h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 text-xs md:text-sm"
                    >
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                        Nova Transação
                    </Button>
                </div>

                {/* Market Ticker */}
                <div id="dashboard-market-ticker">
                    <MarketTicker />
                </div>

                {/* Stats Cards */}
                <div className="grid gap-2 md:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
                    <Card id="dashboard-balance-card" className="col-span-2 md:col-span-1 bg-gradient-to-br from-emerald-500 to-emerald-700 border-none overflow-hidden relative text-white shadow-lg shadow-emerald-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative p-3 md:p-6">
                            <div className="space-y-0.5 md:space-y-1">
                                <CardTitle className="text-[10px] md:text-sm font-medium text-white/80">
                                    Saldo Total
                                </CardTitle>
                                {loading || loadingContas ? (
                                    <Skeleton className="h-5 md:h-6 w-20 md:w-24 bg-white/20" />
                                ) : (
                                    <div className="text-base md:text-xl font-bold text-white">
                                        {formatCurrency(saldoContas)}
                                    </div>
                                )}
                            </div>
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                <Wallet className="w-3 h-3 md:w-4 md:h-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative pt-0 p-3 md:p-6">
                            {!loading && !loadingContas && !loadingGoals && (
                                <div className="space-y-0.5 max-h-[60px] md:max-h-[80px] overflow-y-auto pr-1 custom-scrollbar-white mt-0.5 md:mt-1">
                                    {[...accounts]
                                        .sort((a, b) => {
                                            const isAEmergency = a.type === 'emergency';
                                            const isBEmergency = b.type === 'emergency';
                                            const isALinked = linkedAccountIds.has(a.id);
                                            const isBLinked = linkedAccountIds.has(b.id);

                                            const isASpecial = isAEmergency || isALinked;
                                            const isBSpecial = isBEmergency || isBLinked;

                                            if (isASpecial && !isBSpecial) return 1;
                                            if (!isASpecial && isBSpecial) return -1;

                                            return b.balance - a.balance;
                                        })
                                        .map(account => {
                                            const isEmergency = account.type === 'emergency';
                                            const isLinkedToGoal = linkedAccountIds.has(account.id);

                                            let containerClass = "hover:bg-white/10";
                                            let iconClass = "text-white/70";
                                            let textClass = "text-white/80 font-medium";
                                            let balanceClass = "text-white/90 font-bold";
                                            let prefix = "";

                                            if (isEmergency) {
                                                containerClass = "bg-gradient-to-r from-red-500 to-red-600 border-none shadow-sm mt-1";
                                                iconClass = "text-white";
                                                textClass = "text-white font-medium";
                                                balanceClass = "text-white font-bold";
                                                prefix = "Reserva - ";
                                            } else if (isLinkedToGoal) {
                                                containerClass = "bg-gradient-to-r from-purple-500 to-purple-600 border-none shadow-sm mt-1";
                                                iconClass = "text-white";
                                                textClass = "text-white font-medium";
                                                balanceClass = "text-white font-bold";
                                                prefix = "Metas - ";
                                            }

                                            return (
                                                <div
                                                    key={account.id}
                                                    className={`flex justify-between items-center text-[9px] md:text-[10px] py-0.5 px-1.5 rounded transition-all ${containerClass}`}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        {isEmergency && (
                                                            <AlertTriangle className={`w-2 h-2 md:w-2.5 md:h-2.5 ${iconClass}`} />
                                                        )}
                                                        {isLinkedToGoal && !isEmergency && (
                                                            <Target className={`w-2 h-2 md:w-2.5 md:h-2.5 ${iconClass}`} />
                                                        )}
                                                        <span className={textClass}>
                                                            {prefix}{account.name}
                                                        </span>
                                                    </div>
                                                    <span className={balanceClass}>
                                                        {formatCurrency(account.balance)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card id="dashboard-receitas-card" className="bg-gradient-to-br from-green-500 to-green-700 border-none overflow-hidden relative text-white shadow-lg shadow-green-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 md:pb-1 relative p-2.5 md:p-6">
                            <CardTitle className="text-[10px] md:text-sm font-medium text-white/80">
                                Receitas
                            </CardTitle>
                            <div className="w-5 h-5 md:w-10 md:h-10 rounded-md md:rounded-lg bg-white/20 flex items-center justify-center">
                                <TrendingUp className="w-2.5 h-2.5 md:w-5 md:h-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative p-2.5 md:p-6 pt-0">
                            {loading ? (
                                <Skeleton className="h-5 md:h-6 w-20 md:w-24 bg-white/20" />
                            ) : (
                                <>
                                    <div className="text-base md:text-2xl font-bold text-white">
                                        {formatCurrency(totalReceitas)}
                                    </div>
                                    <p className="text-[9px] md:text-xs text-white/80 flex items-center mt-0.5 md:mt-1">
                                        <ArrowUpRight className="w-2 h-2 md:w-3 md:h-3 mr-0.5 md:mr-1" />
                                        Este mês
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card id="dashboard-despesas-card" className="bg-gradient-to-br from-red-500 to-red-700 border-none overflow-hidden relative text-white shadow-lg shadow-red-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 md:pb-1 relative p-2.5 md:p-6">
                            <CardTitle className="text-[10px] md:text-sm font-medium text-white/80">
                                Despesas
                            </CardTitle>
                            <div className="w-5 h-5 md:w-10 md:h-10 rounded-md md:rounded-lg bg-white/20 flex items-center justify-center">
                                <TrendingDown className="w-2.5 h-2.5 md:w-5 md:h-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative p-2.5 md:p-6 pt-0">
                            {loading ? (
                                <Skeleton className="h-5 md:h-6 w-20 md:w-24 bg-white/20" />
                            ) : (
                                <>
                                    <div className="text-base md:text-2xl font-bold text-white">
                                        {formatCurrency(totalDespesas)}
                                    </div>
                                    <p className="text-[9px] md:text-xs text-white/80 flex items-center mt-0.5 md:mt-1">
                                        <ArrowDownRight className="w-2 h-2 md:w-3 md:h-3 mr-0.5 md:mr-1" />
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

                <div className="grid gap-3 md:gap-4 md:grid-cols-1 lg:grid-cols-3 items-start w-full min-w-0">
                    {/* 1. Transações Recentes (Compacto) */}
                    <Card className="bg-card border-border h-full flex flex-col overflow-hidden min-w-0 w-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-2.5 px-2.5 md:pt-6 md:px-6">
                            <div>
                                <CardTitle className="text-foreground text-xs md:text-base">Recentes</CardTitle>
                            </div>
                            <Link href="/transacoes" className="text-[9px] md:text-xs text-muted-foreground hover:text-emerald-500 transition-colors flex items-center gap-1">
                                Ver tudo
                                <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            </Link>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-2.5 pt-0 md:p-6 md:pt-0">
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

                    {/* 2. Insights Inteligentes (IA) */}
                    <div id="dashboard-ai-card" className="h-full">
                        <SmartInsightsCard />
                    </div>

                    {/* 3. Previsão */}
                    <div id="dashboard-forecast-card" className="h-full">
                        <ForecastCard />
                    </div>
                </div>
            </div>
        </div>


    );
}
