"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionModal } from "@/components/TransactionModal";
import { ForecastCard } from "@/components/ForecastCard";
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
        .filter(t => !t.installmentNumber || t.installmentNumber === 1)
        .slice(0, 5);
    const economia = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas * 100) : 0;

    return (
        <div className="min-h-screen bg-zinc-950">
            <Header title="Dashboard" />

            <TransactionModal open={showModal} onOpenChange={setShowModal} />

            <div className="p-6 space-y-6">
                {/* Greeting */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {greeting()}, {user?.displayName?.split(" ")[0] || "Usuário"}!
                        </h2>
                        <p className="text-zinc-400 mt-1">
                            Aqui está um resumo das suas finanças
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowModal(true)}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Transação
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-medium text-zinc-400">
                                    Saldo Total
                                </CardTitle>
                                {loading || loadingContas ? (
                                    <Skeleton className="h-6 w-24 bg-zinc-800" />
                                ) : (
                                    <div className={`text-xl font-bold ${saldoContas >= 0 ? 'text-white' : 'text-red-400'}`}>
                                        {formatCurrency(saldoContas)}
                                    </div>
                                )}
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative pt-0">
                            {!loading && !loadingContas && !loadingGoals && (
                                <div className="space-y-0.5 max-h-[80px] overflow-y-auto pr-1 custom-scrollbar mt-1">
                                    {[...accounts]
                                        .sort((a, b) => {
                                            const isAEmergency = a.type === 'emergency';
                                            const isBEmergency = b.type === 'emergency';
                                            const isALinked = linkedAccountIds.has(a.id);
                                            const isBLinked = linkedAccountIds.has(b.id);

                                            const isASpecial = isAEmergency || isALinked;
                                            const isBSpecial = isBEmergency || isBLinked;

                                            // Se um é especial e o outro não, o especial vai para o final
                                            if (isASpecial && !isBSpecial) return 1;
                                            if (!isASpecial && isBSpecial) return -1;

                                            // Se ambos forem especiais ou ambos normais, ordena por saldo
                                            return b.balance - a.balance;
                                        })
                                        .map(account => {
                                            const isEmergency = account.type === 'emergency';
                                            const isLinkedToGoal = linkedAccountIds.has(account.id);

                                            let containerClass = "hover:bg-zinc-800/50";
                                            let iconClass = "text-zinc-400";
                                            let textClass = "text-zinc-400";
                                            let balanceClass = "text-zinc-300";
                                            let prefix = "";

                                            if (isEmergency) {
                                                containerClass = "bg-red-500/10 border border-red-500/20 mt-1";
                                                iconClass = "text-red-400";
                                                textClass = "text-red-300 font-medium";
                                                balanceClass = "text-red-300 font-bold";
                                                prefix = "Reserva - ";
                                            } else if (isLinkedToGoal) {
                                                containerClass = "bg-purple-500/10 border border-purple-500/20 mt-1";
                                                iconClass = "text-purple-400";
                                                textClass = "text-purple-300 font-medium";
                                                balanceClass = "text-purple-300 font-bold";
                                                prefix = "Metas - ";
                                            }

                                            return (
                                                <div
                                                    key={account.id}
                                                    className={`flex justify-between items-center text-[10px] py-0.5 px-1.5 rounded transition-colors ${containerClass}`}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        {isEmergency && (
                                                            <AlertTriangle className={`w-2.5 h-2.5 ${iconClass}`} />
                                                        )}
                                                        {isLinkedToGoal && !isEmergency && (
                                                            <Target className={`w-2.5 h-2.5 ${iconClass}`} />
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

                    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                Receitas
                            </CardTitle>
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            {loading ? (
                                <Skeleton className="h-8 w-32 bg-zinc-800" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-white">
                                        {formatCurrency(totalReceitas)}
                                    </div>
                                    <p className="text-xs text-green-400 flex items-center mt-1">
                                        <ArrowUpRight className="w-3 h-3 mr-1" />
                                        Este mês
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                Despesas
                            </CardTitle>
                            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <TrendingDown className="w-5 h-5 text-red-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            {loading ? (
                                <Skeleton className="h-8 w-32 bg-zinc-800" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-white">
                                        {formatCurrency(totalDespesas)}
                                    </div>
                                    <p className="text-xs text-red-400 flex items-center mt-1">
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



                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4 bg-zinc-900/50 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-white">Transações Recentes</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Últimas movimentações
                                </CardDescription>
                            </div>
                            <Link href="/receitas">
                                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="w-10 h-10 rounded-lg bg-zinc-700" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32 bg-zinc-700" />
                                                    <Skeleton className="h-3 w-24 bg-zinc-700" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-5 w-20 bg-zinc-700" />
                                        </div>
                                    ))}
                                </div>
                            ) : recentTransactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                    <p className="text-zinc-400">Nenhuma transação ainda</p>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        Adicione sua primeira receita ou despesa
                                    </p>
                                    <Button
                                        onClick={() => setShowModal(true)}
                                        className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Adicionar Transação
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentTransactions.map((transaction) => {
                                        // Info da forma de pagamento
                                        const getPaymentIcon = () => {
                                            switch (transaction.paymentMethod) {
                                                case "credit": return <CreditCard className="w-3 h-3" />;
                                                case "boleto": return <Receipt className="w-3 h-3" />;
                                                case "pix": return <Smartphone className="w-3 h-3" />;
                                                default: return <Wallet className="w-3 h-3" />;
                                            }
                                        };
                                        const getPaymentLabel = () => {
                                            switch (transaction.paymentMethod) {
                                                case "credit": return "Cartão";
                                                case "boleto": return transaction.boletoStatus === "pending" ? "Boleto Pendente" : "Boleto";
                                                case "pix": return "PIX";
                                                default: return "Débito";
                                            }
                                        };
                                        const showInstallments = transaction.installments && transaction.installments > 1;

                                        return (
                                            <div
                                                key={transaction.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${transaction.type === "receita"
                                                            ? "bg-green-500/20"
                                                            : "bg-red-500/20"
                                                            }`}
                                                    >
                                                        {transaction.type === "receita" ? (
                                                            <ArrowUpRight className="w-5 h-5 text-green-400" />
                                                        ) : (
                                                            <ArrowDownRight className="w-5 h-5 text-red-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">
                                                            {transaction.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                            <span>{formatDate(transaction.date)}</span>
                                                            {transaction.type === "despesa" && transaction.paymentMethod && (
                                                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-700/50">
                                                                    {getPaymentIcon()}
                                                                    {getPaymentLabel()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span
                                                        className={`font-semibold ${transaction.type === "receita"
                                                            ? "text-green-400"
                                                            : "text-red-400"
                                                            }`}
                                                    >
                                                        {transaction.type === "receita" ? "+" : "-"}
                                                        {formatCurrency(showInstallments && transaction.totalAmount ? transaction.totalAmount : transaction.amount)}
                                                    </span>
                                                    {showInstallments && (
                                                        <p className="text-xs text-zinc-500">
                                                            em {transaction.installments}x de {formatCurrency(transaction.amount)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="col-span-3">
                        <ForecastCard />
                    </div>
                </div>
            </div>
        </div >


    );
}
