"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ReactDOMServer from "react-dom/server";
import {
    Globe,
    Wallet,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    Bot,
    Sparkles,
    Target,
    LayoutDashboard,
    Tag,
    CreditCard,
    ChevronDown,
    Rocket
} from "lucide-react";

export function OnboardingTour() {
    const { user, refreshUser } = useAuth();

    useEffect(() => {
        // Se o usuário não estiver logado ou já tiver completado o tutorial, não faz nada
        if (!user || user.tutorialCompleted) return;

        // Helper para renderizar ícones como string HTML
        const renderIcon = (Icon: any, color: string = "text-primary") => {
            const iconString = ReactDOMServer.renderToString(
                <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <span>{""}</span>
                </div>
            );
            // Extrai apenas o SVG do wrapper div para usar inline se necessário, 
            // ou usa o HTML completo no título
            return iconString.replace('<span></span>', '');
        };

        const driverObj = driver({
            showProgress: true,
            animate: true,
            allowClose: false,
            doneBtnText: "Concluir",
            nextBtnText: "Próximo",
            prevBtnText: "Anterior",
            progressText: "{{current}} de {{total}}",
            popoverClass: "driverjs-theme",
            steps: [
                {
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <Rocket className="w-6 h-6 text-emerald-500" />
                                <span>Bem-vindo ao seu Controle!</span>
                            </div>
                        ),
                        description: "Preparamos um tour rápido para te mostrar as ferramentas poderosas que você tem em mãos para dominar seu dinheiro. Vamos lá?",
                    },
                },
                {
                    element: "#dashboard-market-ticker",
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-500" />
                                <span>Mercado Global</span>
                            </div>
                        ),
                        description: "Fique por dentro das cotações do Dólar, Euro e Criptomoedas em tempo real. Informação essencial para suas decisões financeiras.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-economic-indicators",
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-purple-500" />
                                <span>Indicadores Econômicos</span>
                            </div>
                        ),
                        description: "Acompanhe as taxas oficiais do Brasil (Selic, IPCA, CDI) para saber o melhor momento de investir.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-ticker-toggle",
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                                <span>Controle de Visualização</span>
                            </div>
                        ),
                        description: "Use este botão para expandir ou recolher os cards de mercado e indicadores, mantendo seu dashboard limpo quando não precisar deles.",
                        side: "bottom",
                        align: "center",
                    },
                },
                {
                    element: "#dashboard-balance-card",
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-emerald-600" />
                                <span>Seu Patrimônio</span>
                            </div>
                        ),
                        description: "Aqui você acompanha o saldo consolidado de todas as suas contas bancárias e carteiras cadastradas. Uma visão clara de quanto você tem disponível agora.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-receitas-card",
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <ArrowUpRight className="w-5 h-5 text-green-500" />
                                <span>Entradas do Mês</span>
                            </div>
                        ),
                        description: "Acompanhe tudo que entrou na sua conta este mês. Salários, freelas, vendas e transferências recebidas aparecem aqui.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-despesas-card",
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <ArrowDownRight className="w-5 h-5 text-red-500" />
                                <span>Saídas do Mês</span>
                            </div>
                        ),
                        description: "Controle seus gastos mensais. Veja rapidamente quanto já saiu do seu bolso e mantenha o orçamento em dia.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-new-transaction-btn",
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-600" />
                                <span>Registre em Segundos</span>
                            </div>
                        ),
                        description: "Comprou um café ou recebeu um pix? Clique aqui para registrar receitas e despesas rapidamente e manter tudo organizado.",
                        side: "left",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-ai-card",
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-amber-500" />
                                <span>Sua Assistente Pessoal</span>
                            </div>
                        ),
                        description: "Esta é a joia da coroa! Nossa IA analisa seus hábitos de consumo 24/7 e te dá dicas personalizadas de onde economizar e como investir melhor.",
                        side: "top",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-forecast-card",
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-500" />
                                <span>Olhe para o Futuro</span>
                            </div>
                        ),
                        description: "Não olhe apenas para o passado. Com base nos seus gastos fixos e parcelas, nós projetamos como estará seu saldo nos próximos meses para você não ter surpresas.",
                        side: "top",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-insights-carousel",
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-rose-500" />
                                <span>Gráficos e Metas</span>
                            </div>
                        ),
                        description: "Deslize para o lado para ver gráficos visuais de suas despesas por categoria, acompanhar o progresso das suas metas financeiras e ver sua evolução mensal.",
                        side: "top",
                        align: "start",
                    },
                },
                {
                    element: "#sidebar-menu",
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <LayoutDashboard className="w-5 h-5 text-gray-600" />
                                <span>Explore o Sistema</span>
                            </div>
                        ),
                        description: "Acesse a gestão detalhada de seus Cartões de Crédito, Contas Bancárias, Metas e Relatórios Avançados através deste menu.",
                        side: "right",
                        align: "start",
                    },
                },
                {
                    element: "#sidebar-item-categorias",
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <Tag className="w-5 h-5 text-orange-500" />
                                <span>Categorias Personalizadas</span>
                            </div>
                        ),
                        description: "Crie e edite categorias para organizar suas finanças do seu jeito. Defina cores e ícones para facilitar a visualização.",
                        side: "right",
                        align: "start",
                    },
                },
                {
                    element: "#sidebar-item-assinatura",
                    popover: {
                        title: ReactDOMServer.renderToString(
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-emerald-500" />
                                <span>Gerencie sua Assinatura</span>
                            </div>
                        ),
                        description: "Acompanhe o status do seu plano, veja a data de renovação e acesse recursos exclusivos para assinantes.",
                        side: "right",
                        align: "start",
                    },
                },
            ],
            onDestroyed: async () => {
                // Marcar tutorial como completo no Firestore quando o tour for fechado/concluído
                if (user && user.uid) {
                    try {
                        const userRef = doc(db, "users", user.uid);
                        await updateDoc(userRef, {
                            tutorialCompleted: true
                        });
                        // Atualizar o estado do usuário no contexto para refletir a mudança
                        await refreshUser();
                    } catch (error) {
                        console.error("Erro ao salvar status do tutorial:", error);
                    }
                }
            },
        });

        driverObj.drive();

        return () => {
            driverObj.destroy();
        };
    }, [user]);

    return null; // Componente não renderiza nada visualmente, apenas controla o driver.js
}
