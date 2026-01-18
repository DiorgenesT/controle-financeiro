"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancialInsights } from "@/hooks/useFinancialInsights";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, PieChart, Lightbulb, ChevronRight, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function SmartInsightsCard() {
    const { insights, loading } = useFinancialInsights();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-rotate insights
    useEffect(() => {
        if (insights.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % insights.length);
        }, 8000); // 8 seconds per slide

        return () => clearInterval(interval);
    }, [insights.length]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % insights.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length);
    };

    const getIcon = (iconName?: string) => {
        switch (iconName) {
            case 'TrendingUp': return <TrendingUp className="w-5 h-5" />;
            case 'TrendingDown': return <TrendingDown className="w-5 h-5" />;
            case 'AlertTriangle': return <AlertTriangle className="w-5 h-5" />;
            case 'PieChart': return <PieChart className="w-5 h-5" />;
            case 'Lightbulb': return <Lightbulb className="w-5 h-5" />;
            default: return <Sparkles className="w-5 h-5" />;
        }
    };

    const getGradient = (type: string) => {
        switch (type) {
            case 'warning': return "bg-amber-500/20 text-amber-100 border-amber-500/30";
            case 'success': return "bg-emerald-500/20 text-emerald-100 border-emerald-500/30";
            case 'tip': return "bg-blue-500/20 text-blue-100 border-blue-500/30";
            default: return "bg-purple-500/20 text-purple-100 border-purple-500/30";
        }
    };

    if (loading) {
        return (
            <Card className="bg-card border-border h-full flex flex-col">
                <CardHeader className="pb-2 pt-4 px-4">
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="flex-1 p-4 pt-0">
                    <Skeleton className="h-full w-full rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    if (insights.length === 0) {
        return (
            <Card className="h-full flex flex-col relative overflow-hidden group border-none shadow-lg bg-gradient-to-br from-indigo-600 to-purple-700">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-white/10 backdrop-blur-md shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                        </div>
                        <CardTitle className="text-white text-base font-bold">
                            IA Financeira
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center p-4 pt-0 relative z-10">
                    <p className="text-sm text-white/80 text-center">
                        Adicione movimentações para gerar insights.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const currentInsight = insights[currentIndex];

    return (
        <Card className="h-full flex flex-col relative overflow-hidden group border-none shadow-lg bg-gradient-to-br from-indigo-600 to-purple-700 transition-all duration-500 hover:shadow-purple-500/20 hover:scale-[1.02] min-w-0 w-full">
            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />

            {/* Dynamic Glow based on type - subtle */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-white/10 blur-3xl rounded-full pointer-events-none`} />

            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-white/10 backdrop-blur-md shadow-sm border border-white/10">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <CardTitle className="text-white text-base font-bold tracking-wide">
                        IA Financeira
                    </CardTitle>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10" onClick={prevSlide}>
                        <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10" onClick={nextSlide}>
                        <ChevronRight className="w-3 h-3" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-center p-4 pt-0 relative z-10">
                <div className="animate-in fade-in slide-in-from-right-4 duration-300" key={currentIndex}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border mb-3 backdrop-blur-md shadow-sm ${getGradient(currentInsight.type)}`}>
                        {getIcon(currentInsight.icon)}
                        {currentInsight.title}
                    </div>

                    <p className="text-sm text-white/90 leading-relaxed font-medium drop-shadow-sm">
                        {currentInsight.description}
                    </p>
                </div>

                {/* Indicators */}
                <div className="flex justify-center gap-1.5 mt-4 absolute bottom-4 left-0 right-0">
                    {insights.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'w-1.5 bg-white/30'}`}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
