"use client";

import { useState } from "react";
import { useMarketData } from "@/hooks/useMarketData";
import { TrendingUp, TrendingDown, DollarSign, Euro, Bitcoin, Globe, Coins, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketTickerProps {
    isOpen?: boolean;
    onToggle?: () => void;
}

export function MarketTicker({ isOpen, onToggle }: MarketTickerProps) {
    // Force rebuild
    const { data, loading, error } = useMarketData();
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

    if (error || !data) return null;

    const items = [
        {
            key: 'USDBRL',
            name: 'Dólar',
            symbol: 'USD',
            icon: DollarSign,
            gradient: 'from-emerald-500/20 to-emerald-900/20',
            border: 'hover:border-emerald-500/60',
            text: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            data: data.USDBRL
        },
        {
            key: 'EURBRL',
            name: 'Euro',
            symbol: 'EUR',
            icon: Euro,
            gradient: 'from-blue-500/20 to-blue-900/20',
            border: 'hover:border-blue-500/60',
            text: 'text-blue-500',
            bg: 'bg-blue-500/10',
            data: data.EURBRL
        },
        {
            key: 'BTCBRL',
            name: 'Bitcoin',
            symbol: 'BTC',
            icon: Bitcoin,
            gradient: 'from-amber-500/20 to-amber-900/20',
            border: 'hover:border-amber-500/60',
            text: 'text-amber-500',
            bg: 'bg-amber-500/10',
            data: data.BTCBRL
        },
        {
            key: 'ETHBRL',
            name: 'Ethereum',
            symbol: 'ETH',
            icon: Coins,
            gradient: 'from-purple-500/20 to-purple-900/20',
            border: 'hover:border-purple-500/60',
            text: 'text-purple-500',
            bg: 'bg-purple-500/10',
            data: data.ETHBRL
        }
    ];


    return (
        <div className="w-full h-full">
            <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-3 md:p-4 h-full flex flex-col transition-all hover:shadow-md">
                {/* Header - Adaptive & Collapsible */}
                <div
                    className="flex items-center justify-between mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={toggleState}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-foreground/5 shadow-sm">
                            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                Mercado Global
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-medium">
                                Cotações em tempo real
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                                Ao vivo
                            </p>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-muted-foreground md:hidden transition-transform duration-300", isOpenState && "rotate-180")} />
                    </div>
                </div>

                {/* Content - Collapsible */}
                <div className={cn(
                    "grid grid-cols-2 gap-2 md:gap-3 transition-all duration-300 ease-in-out flex-1 content-start",
                    isOpenState ? "opacity-100 max-h-[500px]" : "max-h-0 opacity-0 overflow-hidden"
                )}>
                    {items.map((item) => {
                        const isPositive = parseFloat(item.data.pctChange) >= 0;
                        const VariationIcon = isPositive ? TrendingUp : TrendingDown;
                        const variationColor = isPositive ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400";
                        const variationBg = isPositive ? "bg-emerald-500/10" : "bg-red-500/10";

                        return (
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
                                            <item.icon className={cn("w-3 h-3", item.text)} />
                                        </div>
                                        <div className={cn("flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold border border-foreground/10", variationBg, variationColor)}>
                                            <VariationIcon className="w-2 h-2" />
                                            {item.data.pctChange}%
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                                            {item.symbol}
                                        </p>
                                        <p className="text-xs md:text-sm font-bold text-foreground tracking-tight">
                                            R$ {parseFloat(item.data.bid).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
