"use client";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Rocket, PlayCircle, BookOpen, BarChart, ShieldCheck, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function AcelerarPage() {
    return (
        <>
            <Header title="Acelere Seus Resultados" />
            <div className="p-4 md:p-8 w-full">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-8 md:p-16 text-center mb-12 border border-blue-500/20 shadow-2xl shadow-blue-500/10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="relative z-10"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold mb-6 uppercase tracking-widest">
                            <Rocket className="w-4 h-4" />
                            Masterclass de Prosperidade
                        </div>

                        <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter">
                            Domine o Jogo do <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Dinheiro</span>.
                        </h1>

                        <p className="text-lg md:text-xl text-blue-100/70 max-w-3xl mx-auto mb-10 leading-relaxed">
                            Não é apenas sobre economizar, é sobre multiplicar. Tenha acesso exclusivo a estratégias de investimento,
                            mentalidade de riqueza e aulas práticas com quem entende de verdade.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="px-8 py-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold backdrop-blur-md">
                                Lançamento em Breve
                            </div>
                        </div>
                    </motion.div>

                    {/* Animated Background Elements */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full animate-pulse" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full animate-pulse" />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-foreground tracking-tight">O que você vai encontrar:</h2>

                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                <PlayCircle className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-foreground">Vídeo-Aulas Exclusivas</h4>
                                <p className="text-muted-foreground">Conteúdo direto ao ponto sobre organização, dívidas e investimentos.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                                <BookOpen className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-foreground">Guias e Planilhas</h4>
                                <p className="text-muted-foreground">Materiais complementares para você aplicar o conhecimento na hora.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-foreground">Mentoria em Grupo</h4>
                                <p className="text-muted-foreground">Sessões mensais de perguntas e respostas com especialistas.</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative group h-full">
                        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/30 transition-all" />
                        <Card className="bg-white/5 border-white/10 backdrop-blur-md relative z-10 overflow-hidden h-full flex flex-col justify-center p-8 border-2 border-blue-500/20 hover:border-blue-500/60 dark:hover:border-blue-500/40 transition-all duration-300 hover:scale-[1.02] shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/30 dark:hover:shadow-blue-500/20">
                            <div className="text-center space-y-4">
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                                    <Trophy className="w-20 h-20 text-blue-500 mx-auto relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                </div>
                                <h3 className="text-2xl font-black text-foreground tracking-tight">Torne-se um Mestre</h3>
                                <p className="text-muted-foreground text-lg">
                                    Saia do básico e entre para o grupo de pessoas que fazem o dinheiro trabalhar para elas.
                                    O conhecimento é o melhor investimento.
                                </p>
                                <div className="pt-6">
                                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-3/4 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                    </div>
                                    <p className="text-xs text-blue-400 mt-3 font-bold uppercase tracking-widest">75% do conteúdo já gravado</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
                {/* Bottom Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Rocket className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold">Conteúdo Premium</h4>
                            <p className="text-blue-100/80">Acesso exclusivo para assinantes em breve.</p>
                        </div>
                    </div>
                    <Button variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 py-6 rounded-xl cursor-default">
                        Em Breve
                    </Button>
                </div>
            </div>
        </>
    );
}
