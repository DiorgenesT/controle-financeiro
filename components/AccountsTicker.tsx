"use client";

import { useEffect, useRef, useState } from "react";
import { Account } from "@/types";
import { getBankByCode } from "@/lib/banks";
import { AlertTriangle, Target } from "lucide-react";

interface AccountsTickerProps {
    accounts: Account[];
    linkedAccountIds: Set<string>;
}

export function AccountsTicker({ accounts, linkedAccountIds }: AccountsTickerProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [shouldScroll, setShouldScroll] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && contentRef.current) {
                // Se o conteúdo for maior que o container, deve scrollar
                const hasOverflow = contentRef.current.scrollWidth > containerRef.current.clientWidth;
                setShouldScroll(hasOverflow);
            }
        };

        checkOverflow();

        const observer = new ResizeObserver(checkOverflow);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [accounts]);

    // Só duplicar contas se for necessário scrollar
    const tickerAccounts = shouldScroll ? [...accounts, ...accounts, ...accounts] : accounts;

    return (
        <div
            ref={containerRef}
            className="w-full overflow-hidden relative mt-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                ref={contentRef}
                className={`flex gap-3 w-max ${shouldScroll ? 'animate-scroll' : ''} ${isHovered && shouldScroll ? 'pause-animation' : ''}`}
                style={{
                    animation: shouldScroll ? `scroll ${accounts.length * 5}s linear infinite` : 'none'
                }}
            >
                {tickerAccounts.map((account, index) => (
                    <TickerItem
                        key={`${account.id}-${index}`}
                        account={account}
                        isLinked={linkedAccountIds.has(account.id)}
                    />
                ))}
            </div>

            <style jsx>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); }
                }
                .pause-animation {
                    animation-play-state: paused !important;
                }
            `}</style>
        </div>
    );
}

function TickerItem({ account, isLinked }: { account: Account; isLinked: boolean }) {
    const [isItemHovered, setIsItemHovered] = useState(false);
    const bank = getBankByCode(account.bankCode || 'outro');
    const isEmergency = account.type === 'emergency';

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    // Determinar cores
    const bankColor = bank.color;
    // Contraste simples
    const isLightColor = ['#FFD100', '#FFCC00', '#00FF5F', '#f7f7f7', '#ffffff'].includes(bankColor);
    const hoverTextColor = isLightColor ? "#000000" : "#FFFFFF";

    return (
        <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-default shadow-sm group relative overflow-hidden"
            style={{
                backgroundColor: isItemHovered ? bankColor : 'rgba(255, 255, 255, 0.9)', // Fundo sempre branco (com leve transparência)
                borderColor: isItemHovered ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                color: isItemHovered ? hoverTextColor : bankColor, // Texto na cor do banco
            }}
            onMouseEnter={() => setIsItemHovered(true)}
            onMouseLeave={() => setIsItemHovered(false)}
        >
            {/* Ícone Especial (Reserva/Meta) */}
            {isEmergency && (
                <div className={`p-0.5 rounded-full ${isItemHovered ? 'bg-white/20' : 'bg-black/5'}`}>
                    <AlertTriangle className="w-3 h-3" />
                </div>
            )}
            {isLinked && !isEmergency && (
                <div className={`p-0.5 rounded-full ${isItemHovered ? 'bg-white/20' : 'bg-black/5'}`}>
                    <Target className="w-3 h-3" />
                </div>
            )}

            {/* Nome da Conta */}
            <span className="text-[11px] font-semibold whitespace-nowrap">
                {account.name}
            </span>

            {/* Separador */}
            <div className="w-px h-3 bg-current opacity-20" />

            {/* Saldo */}
            <span className="text-[11px] font-medium whitespace-nowrap opacity-90">
                {formatCurrency(account.balance)}
            </span>
        </div>
    );
}
