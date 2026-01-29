"use client";

import React from 'react';
import {
    Sun,
    Moon,
    Cloud,
    CloudSun,
    CloudMoon,
    CloudRain,
    CloudLightning,
    CloudDrizzle,
    CloudSnow,
    CloudFog
} from 'lucide-react';
import { motion } from 'framer-motion';

export const SunIcon = () => (
    <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="text-amber-500"
    >
        <Sun size={24} fill="currentColor" fillOpacity={1} />
    </motion.div>
);

export const MoonIcon = () => (
    <motion.div
        animate={{ rotate: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="text-indigo-400"
    >
        <Moon size={24} fill="currentColor" fillOpacity={1} />
    </motion.div>
);

export const CloudSunIcon = () => (
    <div className="relative">
        <motion.div
            animate={{ x: [0, 2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-slate-400"
        >
            <Cloud size={24} fill="currentColor" fillOpacity={1} />
        </motion.div>
        <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1 -right-1 text-amber-500"
        >
            <Sun size={14} fill="currentColor" fillOpacity={1} />
        </motion.div>
    </div>
);

export const CloudMoonIcon = () => (
    <div className="relative">
        <motion.div
            animate={{ x: [0, 2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-slate-400"
        >
            <Cloud size={24} fill="currentColor" fillOpacity={1} />
        </motion.div>
        <motion.div
            animate={{ rotate: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1 -right-1 text-indigo-400"
        >
            <Moon size={14} fill="currentColor" fillOpacity={1} />
        </motion.div>
    </div>
);

export const CloudyIcon = () => (
    <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="text-slate-400"
    >
        <Cloud size={24} fill="currentColor" fillOpacity={1} />
    </motion.div>
);

export const RainIcon = () => (
    <motion.div
        animate={{ y: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-blue-500"
    >
        <CloudRain size={24} fill="currentColor" fillOpacity={1} />
    </motion.div>
);

export const StormIcon = () => (
    <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
        className="text-slate-700"
    >
        <CloudLightning size={24} fill="currentColor" fillOpacity={1} className="text-yellow-500" />
    </motion.div>
);

export const DrizzleIcon = () => (
    <motion.div
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-blue-300"
    >
        <CloudDrizzle size={24} fill="currentColor" fillOpacity={1} />
    </motion.div>
);

export const SnowIcon = () => (
    <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="text-blue-100"
    >
        <CloudSnow size={24} fill="currentColor" fillOpacity={1} />
    </motion.div>
);

export const FogIcon = () => (
    <motion.div
        animate={{ x: [-2, 2, -2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="text-slate-300"
    >
        <CloudFog size={24} fill="currentColor" fillOpacity={1} />
    </motion.div>
);
