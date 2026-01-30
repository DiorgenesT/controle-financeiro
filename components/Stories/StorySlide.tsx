"use client";

import { motion, useMotionValue, animate } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface StorySlideProps {
    children: React.ReactNode;
    className?: string;
    backgroundClass?: string; // Fallback if no gradient provided
    gradient?: string; // Custom gradient class or style
}

export function StorySlide({ children, className, backgroundClass, gradient }: StorySlideProps) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        // Subtle parallax effect on mouse move
        const { clientX, clientY, currentTarget } = e;
        const { width, height, left, top } = currentTarget.getBoundingClientRect();
        mouseX.set((clientX - left) / width - 0.5);
        mouseY.set((clientY - top) / height - 0.5);
    };

    return (
        <motion.div
            className={cn("absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6 text-center overflow-hidden", className)}
            onMouseMove={handleMouseMove}
        >
            {/* Dynamic Background */}
            <div className={cn("absolute inset-0 z-0 bg-slate-900 transition-colors duration-1000", backgroundClass)} />

            {/* Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.15] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none z-[1]" />

            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-[2] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -30 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} // Bezier for "apple-like" smooth motion
                className="relative z-10 w-full max-w-md flex flex-col items-center justify-center h-full gap-3 md:gap-6"
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

// ------------------------------------------------------------------
// Typography Components
// ------------------------------------------------------------------

export function StoryTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.h2
            initial={{ opacity: 0, y: 40, rotateX: -20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring", bounce: 0.3 }}
            className={cn(
                "text-4xl md:text-6xl font-black text-white tracking-tighter leading-none drop-shadow-2xl py-2",
                "bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60", // Metallic text effect
                className
            )}
        >
            {children}
        </motion.h2>
    );
}

export function StoryValue({ value, prefix = "", suffix = "", className, decimals }: { value: number; prefix?: string; suffix?: string; className?: string; decimals?: number }) {
    // CountUp Logic
    const nodeRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!nodeRef.current) return;

        const controls = animate(0, value, {
            duration: 2.5,
            ease: [0.22, 1, 0.36, 1], // Custom cubic bezier
            onUpdate: (v) => {
                if (nodeRef.current) {
                    nodeRef.current.textContent = v.toLocaleString('pt-BR', {
                        minimumFractionDigits: decimals !== undefined ? decimals : (value % 1 === 0 ? 0 : 2),
                        maximumFractionDigits: decimals !== undefined ? decimals : 2
                    });
                }
            }
        });

        return () => controls.stop();
    }, [value]);

    return (
        <div className={cn("flex flex-col items-center justify-center", className)}>
            <motion.div
                initial={{ scale: 0.5, opacity: 0, filter: "blur(10px)" }}
                animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.4 }}
                className="flex items-baseline gap-1"
            >
                {prefix && <span className="text-2xl md:text-4xl font-light text-white/60 align-top">{prefix}</span>}
                <span ref={nodeRef} className="text-6xl md:text-8xl font-black text-white tracking-tight tabular-nums">0</span>
                {suffix && <span className="text-2xl md:text-4xl font-light text-white/60">{suffix}</span>}
            </motion.div>
        </div>
    );
}

export function StoryContent({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className={cn("text-lg md:text-xl text-white/80 font-medium leading-relaxed max-w-xs mx-auto text-balance", className)}
        >
            {children}
        </motion.div>
    );
}

export function StoryIcon({ icon: Icon, className, color = "bg-white" }: { icon: React.ElementType; className?: string; color?: string }) {
    return (
        <motion.div
            initial={{ scale: 0, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="mb-4 relative"
        >
            {/* Glow behind icon */}
            <div className={cn("absolute inset-0 blur-2xl opacity-40 scale-150", color)} />

            <div className="relative p-6 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl ring-1 ring-white/10">
                <Icon className={cn("w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-md", className)} />
            </div>
        </motion.div>
    );
}
