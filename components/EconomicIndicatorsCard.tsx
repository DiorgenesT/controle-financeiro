"use client";

import { useState } from "react";
import { useEconomicData } from "@/hooks/useEconomicData";
import { TrendingUp, TrendingDown, Percent, BarChart2, Landmark, Wallet, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface EconomicIndicatorsCardProps {
    isOpen?: boolean;
    onToggle?: () => void;
}

export function EconomicIndicatorsCard({ isOpen, onToggle }: EconomicIndicatorsCardProps) {
    const { data, loading } = useEconomicData();
    // Use internal state if props are not provided (fallback)
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpenState = isOpen !== undefined ? isOpen : internalOpen;
    const toggleState = onToggle || (() => setInternalOpen(!internalOpen));

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-2xl border border-foreground/15" />
                ))}
            </div>
        );
    }

    const indicators = [
        {
            key: 'selic',
            name: 'Selic',
            value: data.selic?.value,
            suffix: '% a.a.',
            icon: Landmark,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'hover:border-blue-500/60',
            gradient: 'from-blue-500/20 to-blue-900/20',
            description: 'Taxa Básica'
        },
        {
            key: 'ipca',
            name: 'IPCA',
            value: data.ipca?.value,
            suffix: '% a.m.',
            icon: TrendingUp,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            border: 'hover:border-red-500/60',
            gradient: 'from-red-500/20 to-red-900/20',
            description: 'Inflação'
        },
        {
            key: 'cdi',
            name: 'CDI',
            value: data.cdi?.value,
            suffix: '% a.m.',
            icon: BarChart2,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'hover:border-emerald-500/60',
            gradient: 'from-emerald-500/20 to-emerald-900/20',
            description: 'Renda Fixa'
        },
        {
            key: 'poupanca',
            name: 'Poupança',
            value: data.poupanca?.value,
            suffix: '% a.m.',
            icon: Wallet,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            border: 'hover:border-amber-500/60',
            gradient: 'from-amber-500/20 to-amber-900/20',
            description: 'Rendimento'
        }
    ];


    return (
        <div className="w-full h-full">
            <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-3 md:p-4 h-full flex flex-col transition-all hover:shadow-md">
                <div
                    className="flex items-center justify-between mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={toggleState}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-foreground/5 shadow-sm">
                            <Percent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                Indicadores (Brasil)
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-medium">
                                Taxas oficiais do BC
                            </p>
                        </div>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground md:hidden transition-transform duration-300", isOpenState && "rotate-180")} />
                </div>

                <div className={cn(
                    "grid grid-cols-2 gap-2 md:gap-3 transition-all duration-300 ease-in-out flex-1 content-start",
                    isOpenState ? "opacity-100 max-h-[500px]" : "max-h-0 opacity-0 overflow-hidden"
                )}>
                    {indicators.map((item) => (
                        <div
                            key={item.key}
                            className={cn(
                                "relative overflow-hidden group rounded-lg border border-border bg-background/50 hover:bg-background transition-all duration-300",
                                item.border
                            )}
                        >
                            {/* Background Gradient */}
                            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", item.gradient)} />

                            <div className="relative p-2.5 z-10 flex flex-col justify-between h-full gap-1.5">
                                <div className="flex items-start justify-between">
                                    <div className={cn("w-5 h-5 rounded-md flex items-center justify-center transition-colors duration-300", item.bg)}>
                                        <item.icon className={cn("w-3 h-3", item.color)} />
                                    </div>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider border border-foreground/10 px-1 py-0.5 rounded">
                                        {item.description}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                                        {item.name}
                                    </p>
                                    <p className="text-xs md:text-sm font-bold text-foreground tracking-tight">
                                        {item.value !== undefined ? item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                        <span className="text-[9px] font-medium text-muted-foreground ml-1">{item.suffix}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
