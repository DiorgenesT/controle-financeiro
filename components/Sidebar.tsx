"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    TrendingUp,
    TrendingDown,
    Target,
    BarChart3,
    Settings,
    LogOut,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    Tag,
    Wallet,
    ArrowLeftRight,
    Barcode,
    Repeat,
    Sparkles,
    Rocket,
    Gamepad2,
    Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export const menuItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Contas",
        href: "/contas",
        icon: Wallet,
    },
    {
        title: "Cartões",
        href: "/cartoes",
        icon: CreditCard,
    },
    {
        title: "Boletos",
        href: "/boletos",
        icon: Barcode,
    },
    {
        title: "Transações",
        href: "/transacoes",
        icon: ArrowLeftRight,
    },
    {
        title: "Fixas",
        href: "/fixas",
        icon: Repeat,
    },
    {
        title: "Metas",
        href: "/metas",
        icon: Target,
    },
    {
        title: "Relatórios",
        href: "/relatorios",
        icon: BarChart3,
    },
];

export const premiumMenuItems = [
    {
        title: "Acelerar",
        href: "/acelerar",
        icon: Rocket,
        color: "text-blue-400",
    },
    {
        title: "Arena",
        href: "/arena",
        icon: Gamepad2,
        color: "text-purple-400",
    },
];

export const bottomMenuItems = [
    {
        title: "Categorias",
        href: "/categorias",
        icon: Tag,
    },
    {
        title: "Assinatura",
        href: "/assinatura",
        icon: CreditCard,
    },
    {
        title: "Configurações",
        href: "/configuracoes",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <aside
            className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border flex-col"
        >
            {/* Header - mesma altura do Header principal (h-20) */}
            <div className="h-20 px-4 flex items-center border-b border-sidebar-border">
                <Link href="/dashboard" className="flex items-center gap-3 px-2 w-full justify-center">
                    <div className="relative w-56 h-20">
                        <Image
                            src="/logo-new.png"
                            alt="Tudo Em Dia"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </Link>
            </div>

            {/* Navigation — scrollável para telas baixas (ex: 1366x768) */}
            <nav id="sidebar-menu" className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-none">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            id={`sidebar-item-${item.href.replace("/", "")}`}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                                isActive
                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
                                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-white")} />
                            <span className="font-medium">{item.title}</span>
                        </Link>
                    );
                })}

                <div className="pt-3 pb-1.5 px-3">
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Especial</p>
                </div>

                {premiumMenuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            id={`sidebar-item-${item.href.replace("/", "")}`}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20"
                                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-white" : item.color)} />
                            <span className="font-medium">{item.title}</span>
                            {!isActive && (
                                <span className="ml-auto text-[10px] font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Em Breve
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <Separator className="bg-sidebar-border" />

            {/* Bottom Menu — fixo na parte inferior, nunca é cortado */}
            <div className="p-3 space-y-0.5">
                {bottomMenuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            id={`sidebar-item-${item.href.replace("/", "")}`}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                                isActive
                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
                                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-white")} />
                            <span className="font-medium">{item.title}</span>
                        </Link>
                    );
                })}
            </div>

            <div className="p-3 flex justify-center">
                <span className="text-[10px] font-medium text-muted-foreground/40 tracking-widest uppercase">
                    Versão 1.0.0
                </span>
            </div>


        </aside>
    );
}
