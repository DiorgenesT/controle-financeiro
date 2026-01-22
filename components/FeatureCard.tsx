"use client";

import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
    return (
        <div className="group relative p-8 rounded-[2rem] bg-white border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-emerald-500/30">

            {/* 1. Vibrant Gradient Flood - The Core Impact */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" />

            {/* 2. Dynamic Background Shapes - "Alive" feel without neon */}
            {/* Large rotating circle top-right */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-45" />
            {/* Floating bubble bottom-left */}
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-900/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out group-hover:scale-110" />

            {/* 3. Texture/Noise Overlay (Optional for premium feel) */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay transition-opacity duration-500" />

            <div className="relative z-10 flex flex-col h-full">
                {/* Icon Container - Glassmorphism on Green */}
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 transition-all duration-500 
          group-hover:bg-white/20 
          group-hover:backdrop-blur-md 
          group-hover:scale-110 
          group-hover:-rotate-3 
          group-hover:shadow-lg 
          group-hover:shadow-black/5 
          border border-transparent group-hover:border-white/30">

                    <Icon className="w-8 h-8 text-emerald-600 transition-colors duration-300 group-hover:text-white" />
                </div>

                {/* Text Content */}
                <h3 className="text-2xl font-bold mb-3 text-zinc-800 transition-colors duration-300 group-hover:text-white">
                    {title}
                </h3>
                <p className="text-zinc-600 leading-relaxed transition-colors duration-300 group-hover:text-emerald-50 mb-6">
                    {description}
                </p>


            </div>
        </div>
    );
}
