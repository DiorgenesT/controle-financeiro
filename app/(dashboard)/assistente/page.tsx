"use client";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Sparkles, Mic, MessageSquare, BrainCircuit, Zap, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function AssistentePage() {
    return (
        <>
            <Header title="Assistente IA" />
            <div className="p-4 md:p-8 w-full">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 p-8 md:p-16 text-center mb-12 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative z-10"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-6 uppercase tracking-widest">
                            <Sparkles className="w-4 h-4" />
                            Inteligência Artificial de Elite
                        </div>

                        <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter">
                            O Futuro das suas <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Finanças</span> chegou.
                        </h1>

                        <p className="text-lg md:text-xl text-emerald-100/70 max-w-3xl mx-auto mb-10 leading-relaxed">
                            Imagine um assistente que não apenas organiza, mas antecipa cada movimento seu.
                            Controle tudo por voz, receba previsões cirúrgicas e converse com a inteligência que entende o seu bolso.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="px-8 py-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold backdrop-blur-md">
                                Em Breve • Q1 2026
                            </div>
                        </div>
                    </motion.div>

                    {/* Animated Background Elements */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/20 blur-[100px] rounded-full animate-pulse" />
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/30 dark:hover:shadow-emerald-500/10 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 dark:from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-8 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]">
                                <Mic className="w-7 h-7 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-emerald-400 transition-colors">Comandos de Voz</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                "Lancei 50 reais de gasolina agora". Pronto. Sem abrir menus, sem digitar. Simples como falar.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 dark:hover:shadow-blue-500/10 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 dark:from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-8 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]">
                                <BrainCircuit className="w-7 h-7 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-blue-400 transition-colors">Análise Preditiva</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Nossa IA aprende seus hábitos e avisa: "Se continuar assim, seu saldo acaba dia 22". Antecipe-se ao caos.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/30 dark:hover:shadow-purple-500/10 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 dark:from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-8 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-purple-500/20 shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)]">
                                <MessageSquare className="w-7 h-7 text-purple-500" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-purple-400 transition-colors">Chat Consultivo</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                "Posso comprar esse iPhone parcelado?". A IA analisa suas faturas e metas antes de te dar o veredito.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Banner */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Star className="w-6 h-6 fill-white" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold">Acesso Antecipado</h4>
                            <p className="text-emerald-100/80">Usuários Premium terão prioridade no lançamento.</p>
                        </div>
                    </div>
                    <Button variant="secondary" className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-6 rounded-xl cursor-default">
                        Em Breve
                    </Button>
                </div>
            </div>
        </>
    );
}
