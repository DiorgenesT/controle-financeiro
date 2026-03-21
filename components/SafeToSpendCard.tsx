"use client";

import { useSafeToSpend, SafeToSpendWarning } from "@/hooks/useSafeToSpend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    ShieldCheck,
    Info,
    TrendingDown,
    AlertTriangle,
    Lock,
    CalendarDays,
    Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function getTheme(warning: SafeToSpendWarning, safeAmount: number) {
    if (warning === "overspent" || warning === "commitments_exceed_income") {
        return {
            gradient: "from-rose-950 via-rose-900 to-rose-950",
            orb1: "bg-rose-500/20",
            orb2: "bg-red-500/15",
            accent: "text-rose-400",
            border: "ring-rose-500/20",
            bar: "bg-rose-500",
            badge: "border-rose-500/30 text-rose-400",
        };
    }
    if (warning === "low_balance") {
        return {
            gradient: "from-amber-950 via-amber-900 to-amber-950",
            orb1: "bg-amber-500/20",
            orb2: "bg-yellow-500/15",
            accent: "text-amber-400",
            border: "ring-amber-500/20",
            bar: "bg-amber-500",
            badge: "border-amber-500/30 text-amber-400",
        };
    }
    if (safeAmount > 0) {
        return {
            gradient: "from-emerald-950 via-slate-900 to-slate-950",
            orb1: "bg-emerald-500/20",
            orb2: "bg-teal-500/15",
            accent: "text-emerald-400",
            border: "ring-emerald-500/20",
            bar: "bg-emerald-500",
            badge: "border-emerald-500/30 text-emerald-400",
        };
    }
    return {
        gradient: "from-slate-900 via-slate-800 to-slate-900",
        orb1: "bg-slate-500/15",
        orb2: "bg-slate-600/10",
        accent: "text-slate-400",
        border: "ring-white/10",
        bar: "bg-slate-500",
        badge: "border-slate-500/30 text-slate-400",
    };
}

function warningMessage(warning: SafeToSpendWarning) {
    if (warning === "commitments_exceed_income")
        return "Seus compromissos fixos e metas consomem toda a renda estimada. Revise suas despesas fixas ou metas.";
    if (warning === "overspent")
        return "Você já gastou mais do que o orçamento variável deste mês permite. Segure os gastos até o próximo mês.";
    if (warning === "low_balance")
        return "Seu saldo está abaixo do orçamento mensal variável. O valor foi reduzido por segurança.";
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Not-available state (first month of use)
// ─────────────────────────────────────────────────────────────────────────────

function NotAvailableState() {
    return (
        <div className="h-full flex flex-col items-center justify-center gap-3 py-6 px-4 text-center">
            <div className="p-3 rounded-full bg-white/5 ring-1 ring-white/10">
                <Lock className="w-5 h-5 text-white/40" />
            </div>
            <div>
                <p className="text-white font-semibold text-sm">Disponível no 2º mês</p>
                <p className="text-white/40 text-xs mt-1 leading-relaxed">
                    Precisamos de pelo menos um mês completo de dados para calcular com segurança o quanto você pode gastar por dia.
                </p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main card
// ─────────────────────────────────────────────────────────────────────────────

export function SafeToSpendCard() {
    const data = useSafeToSpend();
    const theme = getTheme(data.warning, data.safeAmount);

    return (
        <Card className={cn(
            "h-full flex flex-col relative overflow-hidden group border-0 shadow-2xl transition-all duration-500 min-w-0 w-full",
            `ring-1 ${theme.border}`
        )}>
            {/* Background */}
            <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-700", theme.gradient)} />
            <div className={cn("absolute -top-20 -right-20 w-56 h-56 blur-[70px] rounded-full mix-blend-screen animate-pulse", theme.orb1)} />
            <div className={cn("absolute -bottom-20 -left-20 w-56 h-56 blur-[70px] rounded-full mix-blend-screen animate-pulse delay-1000", theme.orb2)} />
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />

            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
                        <ShieldCheck className={cn("w-3.5 h-3.5", theme.accent)} />
                    </div>
                    <CardTitle className="text-white text-sm md:text-base font-bold tracking-wide drop-shadow-sm">
                        Seguro Gastar Hoje
                    </CardTitle>
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <button className="hover:bg-white/10 p-1.5 rounded-full transition-colors">
                            <Info className="w-5 h-5 text-white/50 hover:text-white transition-colors" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-4 bg-slate-900/95 border-slate-700 text-slate-100 backdrop-blur-xl" align="end">
                        <div className="space-y-3">
                            <h4 className={cn("font-semibold text-sm", theme.accent)}>Como é calculado?</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Renda média histórica (90% para segurança) subtraindo despesas fixas, contribuições mensais para metas e um buffer de segurança de 10%.
                            </p>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                O resultado é dividido pelos dias do mês. Se você gastar menos em um dia, o valor acumula para os próximos — e vice-versa.
                            </p>
                            {data.available && !data.loading && (
                                <div className="border-t border-slate-800 pt-3 space-y-1.5">
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Sua base do mês</p>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between text-slate-300">
                                            <span>Renda estimada</span>
                                            <span className="text-emerald-400">{fmt(data.breakdown.avgIncome)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-300">
                                            <span>Despesas fixas</span>
                                            <span className="text-rose-400">−{fmt(data.breakdown.fixedExpenses)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-300">
                                            <span>Metas</span>
                                            <span className="text-amber-400">−{fmt(data.breakdown.goalContributions)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-300">
                                            <span>Buffer de segurança</span>
                                            <span className="text-slate-400">−{fmt(data.breakdown.safetyBuffer)}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold border-t border-slate-700 pt-1 mt-1">
                                            <span className="text-slate-200">Disponível no mês</span>
                                            <span className={theme.accent}>{fmt(data.monthlyDisposable)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <p className="text-[10px] text-slate-500 border-t border-slate-800 pt-2">
                                Este é um valor estimado, não uma garantia. Registre todos seus gastos para manter a precisão.
                            </p>
                        </div>
                    </PopoverContent>
                </Popover>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between p-4 pt-0 relative z-10">
                {data.loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-emerald-500 animate-spin" />
                    </div>
                ) : !data.available ? (
                    <NotAvailableState />
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={data.warning ?? "ok"}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-3"
                        >
                            {/* Main amount */}
                            <div className="flex flex-col items-center py-3">
                                {data.warning === "overspent" || data.warning === "commitments_exceed_income" ? (
                                    <div className="flex flex-col items-center gap-1">
                                        <TrendingDown className="w-8 h-8 text-rose-400 mb-1" />
                                        <p className="text-white/60 text-xs text-center">R$ 0,00</p>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-[9px] text-white/40 uppercase tracking-widest mb-1">hoje você pode gastar</span>
                                        <motion.h2
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                                            className={cn("text-3xl md:text-4xl font-black tracking-tighter tabular-nums drop-shadow-lg", theme.accent)}
                                        >
                                            {fmt(data.safeAmount)}
                                        </motion.h2>

                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[10px] text-white/40">
                                                {fmt(data.dailyBudget)}/dia
                                            </span>
                                            {data.accumulatedDays > 0 && (
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/10 border border-white/10">
                                                    <CalendarDays className="w-2.5 h-2.5 text-white/50" />
                                                    <span className="text-[9px] text-white/60 font-medium">
                                                        +{data.accumulatedDays}d acumulado{data.accumulatedDays > 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Monthly budget progress */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-white/40 uppercase tracking-wider">Orçamento do mês</span>
                                    <span className={cn("text-[9px] font-bold", theme.accent)}>
                                        {data.monthlyBudgetUsedPct}%
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${data.monthlyBudgetUsedPct}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={cn("h-full rounded-full", theme.bar)}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] text-white/30">
                                    <span>Gasto: {fmt(data.variableSpentThisMonth)}</span>
                                    <span>Total: {fmt(data.monthlyDisposable)}</span>
                                </div>
                            </div>

                            {/* Warning */}
                            {data.warning && (
                                <div className="flex items-start gap-2 px-2.5 py-2 rounded-xl bg-white/5 border border-white/10">
                                    <AlertTriangle className={cn("w-3 h-3 mt-0.5 shrink-0", theme.accent)} />
                                    <p className="text-[10px] text-white/60 leading-relaxed">
                                        {warningMessage(data.warning)}
                                    </p>
                                </div>
                            )}

                            {/* No warning: motivational nudge */}
                            {!data.warning && data.safeAmount > 0 && data.accumulatedDays === 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5">
                                    <Sparkles className="w-3 h-3 text-white/30 shrink-0" />
                                    <p className="text-[10px] text-white/40">
                                        Gastar abaixo disso acumula pro dia seguinte.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </CardContent>
        </Card>
    );
}
