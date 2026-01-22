"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, Bell, Search, Settings, LogOut, User, CreditCard } from "lucide-react";
import { menuItems, bottomMenuItems } from "@/components/Sidebar";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { AlertTicker } from "@/components/AlertTicker";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsPopover } from "@/components/NotificationsPopover";

interface HeaderProps {
    title?: string;
}

export function Header({ title }: HeaderProps) {
    const { user, signOut } = useAuth();
    const pathname = usePathname();

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
        <header className="sticky top-0 z-30 flex h-20 items-center border-b border-border bg-card/80 backdrop-blur-xl px-4 md:px-6">
            {/* Esquerda - Menu Mobile e Título */}
            <div className="flex items-center gap-4 w-1/4 md:w-1/4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0 bg-sidebar border-r border-sidebar-border">
                        <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                        <div className="h-20 px-4 flex items-center border-b border-sidebar-border">
                            <Link href="/dashboard" className="flex items-center gap-3 px-2 w-full justify-center">
                                <div className="relative w-48 h-16">
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
                        <div className="flex flex-col h-[calc(100vh-5rem)]">
                            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                            <div className="p-3 space-y-1 border-t border-sidebar-border">
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
                        </div>
                    </SheetContent>
                </Sheet>

                {title && (
                    <h1 className="text-xl font-semibold text-foreground hidden md:block">{title}</h1>
                )}
            </div>

            {/* Centro - Alertas */}
            <div className="flex-1 flex justify-center px-4">
                <div className="w-full max-w-xl hidden md:block">
                    <AlertTicker />
                </div>
            </div>

            {/* Direita - Ações */}
            <div className="flex items-center justify-end gap-4 w-1/4">
                {/* Notifications */}
                {/* Notifications */}
                <NotificationsPopover />

                <ThemeToggle />

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10 border-2 border-emerald-500/50">
                                <AvatarImage src={user?.photoURL || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold">
                                    {getInitials(user?.displayName ?? null)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-56 bg-card border-border"
                        align="end"
                        forceMount
                    >
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium text-foreground">
                                    {user?.displayName || "Usuário"}
                                </p>
                                <p className="text-xs text-muted-foreground">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />

                        <DropdownMenuItem asChild>
                            <Link href="/assinatura" className="flex items-center cursor-pointer text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-accent">
                                <CreditCard className="mr-2 h-4 w-4" />
                                <span>Assinatura</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/configuracoes" className="flex items-center cursor-pointer text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-accent">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Configurações</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem
                            className="text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-500/10 cursor-pointer"
                            onClick={signOut}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
