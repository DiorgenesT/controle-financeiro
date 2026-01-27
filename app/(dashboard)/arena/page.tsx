"use client";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { Gamepad2, Trophy, Target, Coins, Swords, Medal, Star, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ArenaPage() {
    return (
        <>
            <Header title="Arena de Desafios" />
            <div className="p-4 md:p-8 w-full">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-violet-900 to-slate-900 p-8 md:p-16 text-center mb-12 border border-purple-500/20 shadow-2xl shadow-purple-500/10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10" />

                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative z-10"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold mb-6 uppercase tracking-widest">
                            <Gamepad2 className="w-4 h-4" />
                            Gamificação Financeira
                        </div>

                        <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter">
                            Transforme sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">Riqueza</span> em Jogo.
                        </h1>

                        <p className="text-lg md:text-xl text-purple-100/70 max-w-3xl mx-auto mb-10 leading-relaxed">
                            Guardar dinheiro nunca foi tão divertido. Complete desafios, suba de nível,
                            conquiste medalhas e compita com você mesmo na jornada para o topo da pirâmide financeira.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="px-8 py-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold backdrop-blur-md">
                                Arena em Construção
                            </div>
                        </div>
                    </motion.div>

                    {/* Animated Background Elements */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-500/20 blur-[100px] rounded-full animate-pulse" />
                </div>

                {/* Challenges Grid */}
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Swords className="w-6 h-6 text-purple-500" />
                    Desafios Lendários
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/30 dark:hover:shadow-purple-500/10 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 dark:from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_10px_-3px_rgba(168,85,247,0.2)] group-hover:scale-110 transition-transform">
                                    <Target className="w-6 h-6 text-purple-500" />
                                </div>
                                <div className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider">Nível 1</div>
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-purple-400 transition-colors">Semana de Ferro</h3>
                            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Passe 7 dias sem gastos supérfluos e ganhe o selo de Disciplina.</p>
                            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 bg-purple-500/5 px-3 py-1.5 rounded-lg w-fit border border-purple-500/10">
                                <Coins className="w-4 h-4" /> +500 XP
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/30 dark:hover:shadow-amber-500/10 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 dark:from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_10px_-3px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform">
                                    <Medal className="w-6 h-6 text-amber-500" />
                                </div>
                                <div className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">Nível 5</div>
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-amber-400 transition-colors">Mestre do Aporte</h3>
                            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Guarde 20% do seu salário por 3 meses seguidos.</p>
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-500/5 px-3 py-1.5 rounded-lg w-fit border border-amber-500/10">
                                <Trophy className="w-4 h-4" /> Troféu de Ouro
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 dark:hover:shadow-blue-500/10 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 dark:from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_10px_-3px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform">
                                    <Star className="w-6 h-6 text-blue-500" />
                                </div>
                                <div className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">Especial</div>
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-blue-400 transition-colors">Caçador de Boletos</h3>
                            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Pague todas as suas contas antes do vencimento por um mês.</p>
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-500/5 px-3 py-1.5 rounded-lg w-fit border border-blue-500/10">
                                <Zap className="w-4 h-4" /> Multiplicador 2x
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Ranking Preview */}
                <Card className="bg-card/50 border-border overflow-hidden">
                    <CardContent className="p-0">
                        <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
                            <h3 className="font-bold text-foreground">Ranking Global (Simulação)</h3>
                            <Button variant="link" className="text-purple-500 text-xs">Ver todos</Button>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { name: "Diorgenes T.", xp: "12.450 XP", rank: 1, color: "text-amber-500" },
                                { name: "Ana Silva", xp: "10.200 XP", rank: 2, color: "text-slate-300" },
                                { name: "Carlos M.", xp: "9.800 XP", rank: 3, color: "text-amber-700" },
                            ].map((user, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={cn("font-black w-4", user.color)}>#{user.rank}</span>
                                        <div className="w-8 h-8 rounded-full bg-muted" />
                                        <span className="font-medium text-sm">{user.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground">{user.xp}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Bottom Banner */}
                <div className="mt-12 bg-gradient-to-r from-purple-600 to-violet-700 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold">Arena de Elite</h4>
                            <p className="text-purple-100/80">Prepare-se para competir e ganhar recompensas reais.</p>
                        </div>
                    </div>
                    <Button variant="secondary" className="bg-white text-purple-700 hover:bg-purple-50 font-bold px-8 py-6 rounded-xl cursor-default">
                        Em Breve
                    </Button>
                </div>
            </div>
        </>
    );
}
