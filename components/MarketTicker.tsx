"use client";

import { useMarketData } from "@/hooks/useMarketData";
import { TrendingUp, TrendingDown, DollarSign, Euro, Bitcoin, Globe, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export function MarketTicker() {
    const { data, loading, error } = useMarketData();

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-2xl border border-white/5" />
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
            gradient: 'from-emerald-500/10 to-emerald-900/10',
            border: 'hover:border-emerald-500/30',
            text: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            data: data.USDBRL
        },
        {
            key: 'EURBRL',
            name: 'Euro',
            symbol: 'EUR',
            icon: Euro,
            gradient: 'from-blue-500/10 to-blue-900/10',
            border: 'hover:border-blue-500/30',
            text: 'text-blue-500',
            bg: 'bg-blue-500/10',
            data: data.EURBRL
        },
        {
            key: 'BTCBRL',
            name: 'Bitcoin',
            symbol: 'BTC',
            icon: Bitcoin,
            gradient: 'from-amber-500/10 to-amber-900/10',
            border: 'hover:border-amber-500/30',
            text: 'text-amber-500',
            bg: 'bg-amber-500/10',
            data: data.BTCBRL
        },
        {
            key: 'ETHBRL',
            name: 'Ethereum',
            symbol: 'ETH',
            icon: Coins,
            gradient: 'from-purple-500/10 to-purple-900/10',
            border: 'hover:border-purple-500/30',
            text: 'text-purple-500',
            bg: 'bg-purple-500/10',
            data: data.ETHBRL
        }
    ];

    return (
        <div className="w-full mb-4 md:mb-8">
            {/* Header - Adaptive */}
            <div className="flex items-center justify-between mb-2 md:mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1 md:p-1.5 rounded-md md:rounded-lg bg-white/5 border border-white/10">
                        <Globe className="w-3 h-3 md:w-3.5 md:h-3.5 text-muted-foreground" />
                    </div>
                    <h3 className="text-xs md:text-sm font-medium text-muted-foreground">Mercado Global</h3>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 px-2 py-0.5 md:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <p className="text-[9px] md:text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        Ao vivo
                    </p>
                </div>
            </div>

            {/* Mobile View: 2x2 Grid (No Scroll) */}
            <div className="grid md:hidden grid-cols-2 gap-2">
                {items.map((item) => {
                    const isPositive = parseFloat(item.data.pctChange) >= 0;
                    const VariationIcon = isPositive ? TrendingUp : TrendingDown;
                    const variationColor = isPositive ? "text-emerald-400" : "text-red-400";

                    return (
                        <div
                            key={item.key}
                            className={cn(
                                "relative group rounded-xl border border-white/5 bg-card/30 backdrop-blur-xl transition-all duration-300",
                                item.border
                            )}
                        >
                            <div className="p-2 flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <div className={cn("w-4 h-4 rounded flex items-center justify-center", item.bg)}>
                                            <item.icon className={cn("w-2.5 h-2.5", item.text)} />
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                            {item.symbol}
                                        </span>
                                    </div>
                                    <div className={cn("flex items-center gap-0.5 text-[9px] font-bold", variationColor)}>
                                        <VariationIcon className="w-2 h-2" />
                                        {item.data.pctChange}%
                                    </div>
                                </div>

                                <p className="text-xs font-bold text-foreground tracking-tight">
                                    R$ {parseFloat(item.data.bid).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop View: Grid & Full Size (Original) */}
            <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-3">
                {items.map((item) => {
                    const isPositive = parseFloat(item.data.pctChange) >= 0;
                    const VariationIcon = isPositive ? TrendingUp : TrendingDown;
                    const variationColor = isPositive ? "text-emerald-400" : "text-red-400";
                    const variationBg = isPositive ? "bg-emerald-400/10" : "bg-red-400/10";

                    return (
                        <div
                            key={item.key}
                            className={cn(
                                "relative overflow-hidden group rounded-2xl border border-white/5 bg-card/30 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1",
                                item.border
                            )}
                        >
                            {/* Background Gradient */}
                            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", item.gradient)} />

                            <div className="relative p-4 z-10 flex flex-col justify-between h-full gap-3">
                                <div className="flex items-start justify-between">
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300", item.bg)}>
                                        <item.icon className={cn("w-4 h-4", item.text)} />
                                    </div>
                                    <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border border-white/5", variationBg, variationColor)}>
                                        <VariationIcon className="w-2.5 h-2.5" />
                                        {item.data.pctChange}%
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                                        {item.name}
                                    </p>
                                    <p className="text-lg font-bold text-foreground tracking-tight">
                                        R$ {parseFloat(item.data.bid).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
