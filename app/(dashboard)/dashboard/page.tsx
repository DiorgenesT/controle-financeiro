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
        .slice(0, 5);
    const economia = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas * 100) : 0;

    return (
        <div className="min-h-screen bg-background">
            <Header title="Dashboard" />

            <TransactionModal open={showModal} onOpenChange={setShowModal} />

            <div className="p-6 space-y-6">
                {/* Greeting */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">
                            {greeting()}, {user?.displayName?.split(" ")[0] || "Usuário"}!
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Aqui está um resumo das suas finanças
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowModal(true)}
                        className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Transação
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-none overflow-hidden relative text-white shadow-lg shadow-emerald-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-medium text-white/80">
                                    Saldo Total
                                </CardTitle>
                                {loading || loadingContas ? (
                                    <Skeleton className="h-6 w-24 bg-white/20" />
                                ) : (
                                    <div className="text-xl font-bold text-white">
                                        {formatCurrency(saldoContas)}
                                    </div>
                                )}
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative pt-0">
                            {!loading && !loadingContas && !loadingGoals && (
                                <div className="space-y-0.5 max-h-[80px] overflow-y-auto pr-1 custom-scrollbar-white mt-1">
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
                                                    className={`flex justify-between items-center text-[10px] py-1 px-2 rounded transition-all ${containerClass}`}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        {isEmergency && (
                                                            <AlertTriangle className={`w-3 h-3 ${iconClass}`} />
                                                        )}
                                                        {isLinkedToGoal && !isEmergency && (
                                                            <Target className={`w-3 h-3 ${iconClass}`} />
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

                    <Card className="bg-gradient-to-br from-green-500 to-green-700 border-none overflow-hidden relative text-white shadow-lg shadow-green-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium text-white/80">
                                Receitas
                            </CardTitle>
                            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            {loading ? (
                                <Skeleton className="h-8 w-32 bg-white/20" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-white">
                                        {formatCurrency(totalReceitas)}
                                    </div>
                                    <p className="text-xs text-white/80 flex items-center mt-1">
                                        <ArrowUpRight className="w-3 h-3 mr-1" />
                                        Este mês
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500 to-red-700 border-none overflow-hidden relative text-white shadow-lg shadow-red-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium text-white/80">
                                Despesas
                            </CardTitle>
                            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <TrendingDown className="w-5 h-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            {loading ? (
                                <Skeleton className="h-8 w-32 bg-white/20" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-white">
                                        {formatCurrency(totalDespesas)}
                                    </div>
                                    <p className="text-xs text-white/80 flex items-center mt-1">
                                        <ArrowDownRight className="w-3 h-3 mr-1" />
                                        Este mês
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <div className="h-full">
                        <InsightsCarousel
                            totalReceitas={totalReceitas}
                            totalDespesas={totalDespesas}
                            accounts={accounts}
                            goals={goals}
                            loading={loading || loadingContas || loadingGoals}
                        />
                    </div>
                </div>



                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3 items-start">
                    {/* 1. Transações Recentes (Compacto) */}
                    <Card className="bg-card border-border h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                            <div>
                                <CardTitle className="text-foreground text-base">Recentes</CardTitle>
                            </div>
                            <Link href="/transacoes" className="text-xs text-muted-foreground hover:text-emerald-500 transition-colors flex items-center gap-1">
                                Ir para Transações
                                <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-4 pt-0">
                            {loading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-10 w-full bg-muted" />
                                    ))}
                                </div>
                            ) : recentTransactions.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Sem transações</p>
                                    <Button
                                        variant="link"
                                        onClick={() => setShowModal(true)}
                                        className="h-auto p-0 text-emerald-500"
                                    >
                                        Adicionar
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-1 overflow-y-auto custom-scrollbar pr-1 max-h-[280px]">
                                    {transactions
                                        .filter(t => {
                                            if (t.installmentNumber && t.installmentNumber > 1) return false;
                                            if (t.paymentMethod === "credit") return false;
                                            if (t.paymentMethod === "boleto" && t.boletoStatus === "pending") return false;
                                            return true;
                                        })
                                        .slice(0, 5) // Max 5 items
                                        .map((transaction) => {
                                            const isReceita = transaction.type === "receita";

                                            return (
                                                <div
                                                    key={transaction.id}
                                                    className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/50 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                                        <div
                                                            className={`w-5 h-5 rounded-[4px] flex items-center justify-center shrink-0 ${isReceita
                                                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                                                                : 'bg-gradient-to-br from-red-500 to-red-600'
                                                                }`}
                                                        >
                                                            {isReceita ? (
                                                                <ArrowUpRight className="w-3 h-3 text-white" />
                                                            ) : (
                                                                <ArrowDownRight className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] font-medium text-foreground truncate">
                                                            {transaction.description}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`text-[11px] font-bold ${isReceita ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            {isReceita ? "+" : "-"}
                                                            {formatCurrency(transaction.amount)}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground w-[35px] text-right">
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
                    <div className="h-full">
                        <SmartInsightsCard />
                    </div>

                    {/* 3. Previsão */}
                    <div className="h-full">
                        <ForecastCard />
                    </div>
                </div>
            </div>
        </div >


    );
}
