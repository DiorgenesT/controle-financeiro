"use client";

import { useState, useEffect, useRef } from "react";
import { useMonthlySummary } from "@/hooks/useMonthlySummary";
import { StorySlide, StoryTitle, StoryContent, StoryIcon, StoryValue } from "@/components/Stories/StorySlide";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Wallet, TrendingUp, TrendingDown, PiggyBank, Sparkles, Ghost, Gem, Brain, AlertTriangle, Banknote, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MonthlyStoriesProps {
    isOpen: boolean;
    onClose: () => void;
    referenceDate?: Date;
}

// Living Background Component - Intensified for better visibility
// Living Background Component - High Visibility
function LivingBackground({ color = "bg-indigo-500", delay = 0 }: { color?: string; delay?: number }) {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay }}
                className={cn("absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full blur-[80px] opacity-20", color)}
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    x: [0, -50, 0],
                    y: [0, -40, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: delay + 1 }}
                className={cn("absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full blur-[80px] opacity-20", color)}
            />
        </div>
    );
}

export function MonthlyStories({ isOpen, onClose, referenceDate }: MonthlyStoriesProps) {
    const { summary, loading } = useMonthlySummary(referenceDate);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setCurrentIndex(0); // Reset when closed
        }
    }, [isOpen]);

    if (!isOpen || loading || !summary) return null;

    // Helper for dynamic transaction text
    const getTransactionText = (count: number) => {
        if (count <= 5) return "Um mês mais tranquilo, poucas movimentações.";
        if (count <= 20) return "Você manteve um ritmo constante de gastos.";
        return "Haja dedo! Você movimentou bastante sua conta este mês.";
    };

    const slides = [
        // Slide 1: Intro
        {
            id: "intro",
            bg: "bg-slate-950",
            gradient: "bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900",
            content: (
                <>
                    <LivingBackground />
                    <StoryIcon icon={Sparkles} color="bg-indigo-500" />
                    <StoryTitle>Seu Mês de<br />{summary.monthName}</StoryTitle>
                    <StoryContent>Preparamos um resumo especial da sua vida financeira.</StoryContent>
                </>
            )
        },
        // Slide 2: Transactions Count & Busy Day
        summary.totalTransactions > 0 ? {
            id: "activity",
            bg: "bg-slate-950",
            gradient: "bg-gradient-to-tr from-blue-900 via-slate-800 to-indigo-900",
            content: (
                <>
                    <LivingBackground />
                    <StoryTitle>Movimento</StoryTitle>
                    <StoryValue value={summary.totalTransactions} suffix=" transações" />
                    <StoryContent>{getTransactionText(summary.totalTransactions)}</StoryContent>

                    {summary.biggestSpendingDay && (
                        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
                            <p className="text-sm text-white/60 mb-1 relative z-10">Dia de maior gasto</p>
                            <p className="text-xl font-bold text-white relative z-10">
                                {summary.biggestSpendingDay.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                            </p>
                            <p className="text-lg text-red-400 font-bold mt-1 relative z-10">
                                - {summary.biggestSpendingDay.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    )}
                </>
            )
        } : null,
        // Slide 3: Expenses
        {
            id: "expenses",
            bg: "bg-slate-950",
            gradient: "bg-gradient-to-bl from-red-900 via-slate-900 to-orange-900",
            content: (
                <>
                    <LivingBackground />
                    <StoryTitle>Você gastou</StoryTitle>
                    <StoryValue value={summary.totalSpent} prefix="R$" decimals={2} />
                    <StoryContent>Esse foi o total que saiu da sua conta.</StoryContent>
                </>
            )
        },
        // Slide 4: Fixed Costs (New)
        summary.fixedCosts ? {
            id: "fixedCost",
            bg: "bg-slate-950",
            gradient: "bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900",
            content: (
                <>
                    <LivingBackground />
                    <StoryIcon icon={TrendingDown} color="bg-gray-500" />
                    <StoryTitle>Custos Fixos</StoryTitle>
                    <StoryValue value={summary.fixedCosts.percentageOfIncome} suffix="%" />
                    <StoryContent>
                        Da sua renda foi para contas recorrentes.
                        <br />
                        <span className="text-white/60 text-sm mt-2 block">
                            Total: {summary.fixedCosts.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </StoryContent>
                </>
            )
        } : null,
        // Slide 5: Consumer Profile (Top Categories)
        summary.topCategory ? {
            id: "category",
            bg: "bg-slate-950",
            gradient: "bg-gradient-to-tr from-pink-900 via-purple-900 to-rose-900",
            content: (
                <>
                    <LivingBackground />
                    <StoryIcon icon={Wallet} color="bg-pink-500" />
                    <StoryTitle>Top Categorias</StoryTitle>
                    <div className="w-full max-w-xs space-y-3 mt-4">
                        {summary.top3Categories.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/10 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                <div className="flex items-center gap-3 z-10">
                                    <span className="text-lg font-bold text-white/50 w-4">#{idx + 1}</span>
                                    <span className="font-bold text-white">{cat.name}</span>
                                </div>
                                <span className="text-white/80 font-medium z-10">
                                    {Math.round(cat.percentage)}%
                                </span>
                                {/* Mini progress bar bg */}
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-white/5 z-0"
                                    style={{ width: `${cat.percentage}%` }}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )
        } : null,
        // Slide 6: Savings
        summary.savingsRate > 0 ? {
            id: "savings",
            bg: "bg-slate-950",
            gradient: "bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900",
            content: (
                <>
                    <LivingBackground />
                    <StoryTitle>Poupança</StoryTitle>
                    <StoryValue value={summary.savingsRate} suffix="%" />
                    <StoryContent>
                        Incrível! Você guardou uma boa parte da sua renda.
                    </StoryContent>
                    <StoryIcon icon={PiggyBank} className="mt-8" color="bg-emerald-500" />
                </>
            )
        } : null,
        // Slide 7: Goals Progress (New)
        summary.goalsProgress && summary.goalsProgress.active > 0 ? {
            id: "goals",
            bg: "bg-slate-950",
            gradient: "bg-gradient-to-tr from-cyan-900 via-blue-900 to-sky-900",
            content: (
                <>
                    <LivingBackground />
                    <StoryIcon icon={TrendingUp} color="bg-cyan-500" />
                    <StoryTitle>Metas</StoryTitle>
                    <StoryContent className="mb-6">
                        Você tem <span className="text-white font-bold">{summary.goalsProgress.active}</span> metas em andamento.
                    </StoryContent>

                    {summary.goalsProgress.topGoal && (
                        <div className="w-full max-w-xs p-5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                            <p className="text-xl font-bold text-center text-white mb-4">{summary.goalsProgress.topGoal.title}</p>
                            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden mb-2">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(summary.goalsProgress.topGoal.currentAmount / summary.goalsProgress.topGoal.targetAmount) * 100}%` }}
                                    transition={{ duration: 1.5, delay: 0.5 }}
                                    className="h-full bg-cyan-400"
                                />
                            </div>
                            <div className="flex justify-between text-xs text-white/50">
                                <span>{((summary.goalsProgress.topGoal.currentAmount / summary.goalsProgress.topGoal.targetAmount) * 100).toFixed(0)}%</span>
                                <span>R$ {summary.goalsProgress.topGoal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    )}
                </>
            )
        } : null,
        // Slide 8: Financial Health Score
        summary.scoreData ? {
            id: "score",
            bg: "bg-slate-950",
            gradient: "bg-gradient-to-br from-indigo-900 via-violet-900 to-fuchsia-900",
            content: (
                <>
                    <LivingBackground />
                    <StoryTitle>Seu Score</StoryTitle>
                    <div className="relative flex items-center justify-center my-8">
                        <div className="absolute inset-0 bg-purple-500/20 blur-[50px] animate-pulse" />
                        <StoryValue value={summary.scoreData.score} className="scale-125" />
                    </div>
                    <div className="px-6 py-2 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-full border border-purple-500/30 backdrop-blur-md">
                        <span className="text-xl font-bold text-purple-200 uppercase tracking-widest">
                            {summary.scoreData.level}
                        </span>
                    </div>
                </>
            )
        } : null,
        // Slide 9: Vibe Verdict
        {
            id: "vibe",
            bg: "bg-slate-950",
            gradient: `bg-gradient-to-br ${summary.financialVibe.color.replace('from-', 'from-').replace('to-', 'to-').split(' ').map(c => c.replace('500', '900')).join(' ')}`,
            content: (
                <>
                    <LivingBackground />
                    {/* Vibe Icon Logic */}
                    {(() => {
                        const getVibeIcon = (title: string) => {
                            switch (title) {
                                case "Fantasma": return Ghost;
                                case "Magnata": return Gem;
                                case "Consciente": return Brain;
                                case "No Limite": return AlertTriangle;
                                case "Gastador": return Banknote;
                                case "Equilibrado": return Scale;
                                default: return Scale;
                            }
                        };
                        const VibeIcon = getVibeIcon(summary.financialVibe.title);

                        return (
                            <StoryIcon
                                icon={VibeIcon}
                                className="w-24 h-24 md:w-32 md:h-32"
                                color={summary.financialVibe.color.split(' ')[0].replace('from-', 'bg-')}
                            />
                        );
                    })()}

                    <StoryTitle>{summary.financialVibe.title}</StoryTitle>
                    <StoryContent>{summary.financialVibe.description}</StoryContent>
                </>
            )
        }
    ].filter(Boolean) as any[];

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-0 md:p-4"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-50 text-white/50 hover:text-white transition-colors p-2 bg-black/20 rounded-full backdrop-blur-md"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Progress Bars */}
                    <div className="absolute top-4 left-4 right-4 z-50 flex gap-1.5 ">
                        {slides.map((_, idx) => (
                            <div key={idx} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: idx < currentIndex ? "100%" : idx === currentIndex ? "100%" : "0%" }}
                                    transition={idx === currentIndex ? { duration: 5, ease: "linear" } : { duration: 0 }}
                                    onAnimationComplete={() => {
                                        if (idx === currentIndex && !paused) {
                                            handleNext();
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Main Container */}
                    <div className="relative w-full h-full md:h-[85vh] md:w-[450px] md:rounded-[2.5rem] overflow-hidden shadow-2xl bg-black ring-1 ring-white/10">
                        {/* Navigation Overlay (Invisible) */}
                        <div className="absolute inset-0 z-40 flex">
                            <div className="w-1/3 h-full" onClick={handlePrev} />
                            <div className="w-2/3 h-full" onClick={handleNext} />
                        </div>

                        {/* Slide Content */}
                        <AnimatePresence mode="wait">
                            <StorySlide
                                key={currentIndex}
                                className="h-full"
                                backgroundClass={slides[currentIndex].bg}
                                gradient={slides[currentIndex].gradient}
                            >
                                {slides[currentIndex].content}
                            </StorySlide>
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
