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
import { Bell, Search, Settings, LogOut, User, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { AlertTicker } from "@/components/AlertTicker";

interface HeaderProps {
    title?: string;
}

export function Header({ title }: HeaderProps) {
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
        <header className="sticky top-0 z-30 flex h-20 items-center border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl px-6">
            {/* Esquerda - Título */}
            <div className="flex items-center gap-4 w-1/4">
                {title && (
                    <h1 className="text-xl font-semibold text-white">{title}</h1>
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
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10 border-2 border-emerald-500/50">
                                <AvatarImage src={user?.photoURL || undefined} />
                                <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                                    {getInitials(user?.displayName ?? null)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-56 bg-zinc-900 border-zinc-800"
                        align="end"
                        forceMount
                    >
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium text-white">
                                    {user?.displayName || "Usuário"}
                                </p>
                                <p className="text-xs text-zinc-400">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem asChild>
                            <Link href="/configuracoes" className="flex items-center cursor-pointer text-zinc-300 hover:text-white focus:text-white focus:bg-zinc-800">
                                <User className="mr-2 h-4 w-4" />
                                <span>Meu Perfil</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/assinatura" className="flex items-center cursor-pointer text-zinc-300 hover:text-white focus:text-white focus:bg-zinc-800">
                                <CreditCard className="mr-2 h-4 w-4" />
                                <span>Assinatura</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/configuracoes" className="flex items-center cursor-pointer text-zinc-300 hover:text-white focus:text-white focus:bg-zinc-800">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Configurações</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem
                            className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
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
