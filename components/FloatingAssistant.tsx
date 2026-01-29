"use client";

import { useState, useEffect } from "react";
import { useFinancialInsights } from "@/hooks/useFinancialInsights";
import { Bot, X, ExternalLink, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FloatingAssistant() {
    const { insights, loading } = useFinancialInsights();
    const [isVisible, setIsVisible] = useState(false);
    const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    // Show assistant after a delay if there are insights
    useEffect(() => {
        if (loading || insights.length === 0 || dismissed) return;

        const showTimer = setTimeout(() => {
            setIsVisible(true);
        }, 3000); // Show after 3 seconds

        return () => clearTimeout(showTimer);
    }, [loading, insights.length, dismissed]);

    // Rotate insights every 5 seconds if visible and not hovered
    useEffect(() => {
        if (!isVisible || isHovered || insights.length <= 1) return;

        const rotateTimer = setInterval(() => {
            setCurrentInsightIndex((prev) => (prev + 1) % insights.length);
        }, 5000);

        return () => clearInterval(rotateTimer);
    }, [isVisible, isHovered, insights.length]);

    // Auto-hide after 30 seconds of inactivity (optional, maybe keep it persistent but minimized?)
    // Let's keep it persistent until closed.

    if (loading || insights.length === 0 || dismissed) return null;

    const currentInsight = insights[currentInsightIndex];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="relative pointer-events-auto mb-4 mr-2 max-w-[300px] md:max-w-[350px]"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-purple-500/20 overflow-hidden relative group">
                            {/* Gradient Border Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/10 to-indigo-500/10 pointer-events-none" />

                            {/* Header */}
                            <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30 backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 rounded-md bg-purple-500/10">
                                        <Bot className="w-3.5 h-3.5 text-purple-500" />
                                    </div>
                                    <span className="text-xs font-bold text-foreground">Assistente</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full hover:bg-red-500/10 hover:text-red-500"
                                    onClick={() => setIsVisible(false)}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="p-4 relative min-h-[100px] flex flex-col justify-center">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentInsightIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <h4 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                                            {currentInsight.title}
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {currentInsight.description}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>

                                {/* Pagination Dots */}
                                {insights.length > 1 && (
                                    <div className="flex justify-center gap-1 mt-3">
                                        {insights.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "w-1.5 h-1.5 rounded-full transition-colors",
                                                    idx === currentInsightIndex ? "bg-purple-500" : "bg-muted"
                                                )}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Speech Bubble Arrow - Classic CSS Triangle for maximum stability */}
                        <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-white dark:bg-slate-900 border-r border-b border-purple-500/20 transform rotate-45 z-10" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Robot Avatar Trigger */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsVisible(!isVisible)}
                className="pointer-events-auto relative group"
                id="dashboard-ai-card"
            >
                <div className="absolute inset-0 bg-purple-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 animate-pulse" />
                <div className="relative w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-xl border-2 border-white/20 z-10">
                    <Bot className="w-6 h-6 md:w-7 md:h-7 text-white" />

                    {/* Notification Badge */}
                    {!isVisible && insights.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background shadow-sm">
                            {insights.length}
                        </span>
                    )}
                </div>
            </motion.button>
        </div>
    );
}
