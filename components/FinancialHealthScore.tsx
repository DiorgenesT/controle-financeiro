"use client";

import { useFinancialScore } from "@/hooks/useFinancialScore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Shield, Wallet } from "lucide-react";

export function FinancialHealthScore() {
    const { scoreData, loading } = useFinancialScore();

    // Calculate circumference for SVG circle
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    // We want a semi-circle (arc) or 3/4 circle. Let's do a 240-degree arc.
    // 240 degrees is 2/3 of a circle.
    const offset = circumference - ((scoreData.score / 1000) * (circumference * 0.75)); // 0.75 for 270 degrees

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-full border-4 border-muted border-t-emerald-500 animate-spin" />
                    <p className="text-muted-foreground text-sm">Calculando Score...</p>
                </div>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score < 300) return "text-red-500"; // Crítico
        if (score < 500) return "text-orange-500"; // Ruim
        if (score < 600) return "text-yellow-500"; // Razoável
        if (score < 700) return "text-lime-500"; // Bom
        if (score < 850) return "text-emerald-500"; // Ótimo
        return "text-purple-500"; // Excelente
    };

    const getScoreGradient = (score: number) => {
        if (score < 300) return "from-red-500 to-rose-600";
        if (score < 500) return "from-orange-500 to-amber-600";
        if (score < 600) return "from-yellow-400 to-amber-500";
        if (score < 700) return "from-lime-400 to-green-500";
        if (score < 850) return "from-emerald-400 to-teal-500";
        return "from-purple-400 to-fuchsia-500";
    };

    return (
        <div className="flex flex-col items-center justify-center h-full relative z-10 py-2">
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Background Circle Track */}
                <svg className="w-full h-full transform -rotate-[135deg]">
                    <circle
                        cx="50%"
                        cy="50%"
                        r="55"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className="text-white/10"
                        strokeDasharray={2 * Math.PI * 55}
                        strokeDashoffset={(2 * Math.PI * 55) * 0.25} // Leave 25% open
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        initial={{ strokeDashoffset: 2 * Math.PI * 55 }}
                        animate={{ strokeDashoffset: (2 * Math.PI * 55) - ((scoreData.score / 1000) * ((2 * Math.PI * 55) * 0.75)) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="50%"
                        cy="50%"
                        r="55"
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 55}
                        className=""
                    />
                    <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={scoreData.score < 500 ? "#ef4444" : scoreData.score < 700 ? "#eab308" : "#34d399"} />
                            <stop offset="100%" stopColor={scoreData.score < 500 ? "#f97316" : scoreData.score < 700 ? "#84cc16" : "#8b5cf6"} />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center"
                    >
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Score</span>
                        <h1 className={cn("text-4xl font-black tracking-tighter drop-shadow-lg leading-none mt-0.5", getScoreColor(scoreData.score))}>
                            {scoreData.score}
                        </h1>
                    </motion.div>
                </div>
            </div>

            {/* Level Indicator */}
            <div className={cn("px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border bg-white/5 backdrop-blur-sm my-3",
                scoreData.score < 300 ? "border-red-500/30 text-red-400" :
                    scoreData.score < 500 ? "border-orange-500/30 text-orange-400" :
                        scoreData.score < 600 ? "border-yellow-500/30 text-yellow-400" :
                            scoreData.score < 700 ? "border-lime-500/30 text-lime-400" :
                                scoreData.score < 850 ? "border-emerald-500/30 text-emerald-400" :
                                    "border-purple-500/30 text-purple-400"
            )}>
                {scoreData.level}
            </div>

            {/* Mini Stats */}
            <div className="grid grid-cols-3 gap-1.5 w-full mt-2 px-2">
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-white/5 border border-white/5 backdrop-blur-sm">
                    <Wallet className="w-2.5 h-2.5 text-blue-400 mb-0.5" />
                    <span className="text-[9px] text-muted-foreground">Poupança</span>
                    <span className="text-xs font-bold text-white">{Math.round(scoreData.details.savingsScore)}</span>
                </div>
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-white/5 border border-white/5 backdrop-blur-sm">
                    <Shield className="w-2.5 h-2.5 text-emerald-400 mb-0.5" />
                    <span className="text-[9px] text-muted-foreground">Estabilidade</span>
                    <span className="text-xs font-bold text-white">{Math.round(scoreData.details.stabilityScore)}</span>
                </div>
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-white/5 border border-white/5 backdrop-blur-sm">
                    <TrendingUp className="w-2.5 h-2.5 text-purple-400 mb-0.5" />
                    <span className="text-[9px] text-muted-foreground">Crescimento</span>
                    <span className="text-xs font-bold text-white">{Math.round(scoreData.details.growthScore)}</span>
                </div>
            </div>
        </div>
    );
}
