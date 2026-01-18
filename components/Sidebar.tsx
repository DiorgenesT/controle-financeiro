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

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
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
            </nav>

            <Separator className="bg-sidebar-border" />

            {/* Bottom Menu */}
            <div className="p-3 space-y-1">
                {bottomMenuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
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


        </aside>
    );
}
