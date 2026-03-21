"use client";

import { useFinancialScore } from "@/hooks/useFinancialScore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, Shield, Wallet, Target } from "lucide-react";

export function FinancialHealthScore() {
    const { scoreData, loading } = useFinancialScore();

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-full border-4 border-white/10 border-t-emerald-500 animate-spin" />
                    <p className="text-white/50 text-sm">Calculando Score...</p>
                </div>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score < 300) return "text-red-500";
        if (score < 500) return "text-orange-500";
        if (score < 600) return "text-yellow-500";
        if (score < 700) return "text-lime-500";
        if (score < 850) return "text-emerald-500";
        return "text-purple-500";
    };

    const getLevelBadgeClass = (score: number) => {
        if (score < 300) return "border-red-500/30 text-red-400";
        if (score < 500) return "border-orange-500/30 text-orange-400";
        if (score < 600) return "border-yellow-500/30 text-yellow-400";
        if (score < 700) return "border-lime-500/30 text-lime-400";
        if (score < 850) return "border-emerald-500/30 text-emerald-400";
        return "border-purple-500/30 text-purple-400";
    };

    // SVG arc: 270-degree gauge
    const r = 55;
    const circ = 2 * Math.PI * r;
    const arcFraction = 0.75; // 270°
    const arcLength = circ * arcFraction;
    const filledLength = (scoreData.score / 1000) * arcLength;

    const gradientStart = scoreData.score < 500
        ? "#ef4444"
        : scoreData.score < 700
            ? "#eab308"
            : "#34d399";
    const gradientEnd = scoreData.score < 500
        ? "#f97316"
        : scoreData.score < 700
            ? "#84cc16"
            : "#8b5cf6";

    // Mini stats config
    const stats = [
        {
            label: "Poupança",
            value: Math.round(scoreData.details.savingsScore),
            max: 350,
            icon: Wallet,
            color: "text-blue-400",
        },
        {
            label: "Reserva",
            value: Math.round(scoreData.details.stabilityScore),
            max: 300,
            icon: Shield,
            color: "text-emerald-400",
        },
        {
            label: "Disciplina",
            value: Math.round(scoreData.details.disciplineScore),
            max: 200,
            icon: Target,
            color: "text-amber-400",
        },
        {
            label: "Tendência",
            value: Math.round(scoreData.details.trendScore),
            max: 150,
            icon: TrendingUp,
            color: "text-purple-400",
        },
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full relative z-10 py-2">
            {/* Gauge circle */}
            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-[135deg]">
                    {/* Track */}
                    <circle
                        cx="50%"
                        cy="50%"
                        r={r}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className="text-white/10"
                        strokeDasharray={`${arcLength} ${circ}`}
                    />
                    {/* Progress */}
                    <motion.circle
                        initial={{ strokeDashoffset: arcLength }}
                        animate={{ strokeDashoffset: arcLength - filledLength }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="50%"
                        cy="50%"
                        r={r}
                        fill="none"
                        stroke="url(#scoreGrad)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${arcLength} ${circ}`}
                    />
                    <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={gradientStart} />
                            <stop offset="100%" stopColor={gradientEnd} />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center"
                    >
                        <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">Score</span>
                        <h1 className={cn("text-4xl font-black tracking-tighter drop-shadow-lg leading-none mt-0.5", getScoreColor(scoreData.score))}>
                            {scoreData.score}
                        </h1>
                    </motion.div>
                </div>
            </div>

            {/* Level badge */}
            <div className={cn(
                "px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border bg-white/5 backdrop-blur-sm my-3",
                getLevelBadgeClass(scoreData.score)
            )}>
                {scoreData.level}
            </div>

            {/* Mini stats — 2×2 grid */}
            <div className="grid grid-cols-2 gap-1.5 w-full px-3">
                {stats.map(({ label, value, max, icon: Icon, color }) => (
                    <div
                        key={label}
                        className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 border border-white/5 backdrop-blur-sm"
                    >
                        <Icon className={cn("w-3 h-3 shrink-0", color)} />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] text-white/50 leading-none">{label}</span>
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-[11px] font-bold text-white leading-none">{value}</span>
                                <span className="text-[7px] text-white/30 leading-none">/{max}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
