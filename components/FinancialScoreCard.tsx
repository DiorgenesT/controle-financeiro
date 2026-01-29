"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Info } from "lucide-react";
import { FinancialHealthScore } from "@/components/FinancialHealthScore";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function FinancialScoreCard() {
    return (
        <Card id="dashboard-score-card" className="h-full flex flex-col relative overflow-hidden group border-0 ring-1 ring-white/20 shadow-2xl shadow-purple-500/20 min-w-0 w-full transition-all duration-500">
            {/* Background - Dark Theme for Score */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-all duration-700" />

            {/* Animated Aurora Orbs */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-400/40 dark:bg-fuchsia-900/20 blur-[80px] rounded-full mix-blend-screen animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-400/40 dark:bg-violet-900/20 blur-[80px] rounded-full mix-blend-screen animate-pulse delay-1000" />

            {/* Glass Texture */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />

            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-white/10 shadow-sm ring-1 ring-white/20 backdrop-blur-md group-hover:bg-white/20 transition-colors duration-500">
                        <BarChart3 className="w-3 h-3 md:w-3.5 md:h-3.5 text-white group-hover:scale-125 group-hover:-rotate-12 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
                    </div>
                    <CardTitle className="text-white text-sm md:text-base font-bold tracking-wide drop-shadow-sm">
                        Score
                    </CardTitle>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="hover:bg-white/10 p-1.5 rounded-full transition-colors">
                            <Info className="w-5 h-5 md:w-6 md:h-6 text-white/70 hover:text-white transition-colors" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4 bg-slate-900/95 border-slate-700 text-slate-100 backdrop-blur-xl" align="end">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none text-emerald-400">Score Interno</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Esta pontuação é calculada exclusivamente com base nos seus registros financeiros dentro do sistema.
                            </p>
                            <p className="text-xs text-slate-400 border-t border-slate-800 pt-2 mt-2">
                                Não possui qualquer vínculo com órgãos de proteção ao crédito (Serasa, SPC, etc).
                            </p>
                        </div>
                    </PopoverContent>
                </Popover>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-center p-0 relative z-10 overflow-hidden">
                <div className="animate-in fade-in zoom-in-95 duration-500 h-full">
                    <FinancialHealthScore />
                </div>
            </CardContent>
        </Card>
    );
}
