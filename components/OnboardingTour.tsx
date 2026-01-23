"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function OnboardingTour() {
    const { user, refreshUser } = useAuth();

    useEffect(() => {
        // Se o usuário não estiver logado ou já tiver completado o tutorial, não faz nada
        if (!user || user.tutorialCompleted) return;

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
                        title: "Bem-vindo ao seu Controle Financeiro! 🚀",
                        description: "Preparamos um tour rápido para te mostrar as ferramentas poderosas que você tem em mãos para dominar seu dinheiro. Vamos lá?",
                    },
                },
                {
                    element: "#dashboard-market-ticker",
                    popover: {
                        title: "Mercado Global 🌎",
                        description: "Fique por dentro das cotações do Dólar, Euro e Criptomoedas em tempo real. Informação essencial para suas decisões financeiras.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-balance-card",
                    popover: {
                        title: "Seu Patrimônio em Tempo Real",
                        description: "Aqui você acompanha o saldo consolidado de todas as suas contas bancárias e carteiras cadastradas. Uma visão clara de quanto você tem disponível agora.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-receitas-card",
                    popover: {
                        title: "Entradas do Mês",
                        description: "Acompanhe tudo que entrou na sua conta este mês. Salários, freelas, vendas e transferências recebidas aparecem aqui.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-despesas-card",
                    popover: {
                        title: "Saídas do Mês",
                        description: "Controle seus gastos mensais. Veja rapidamente quanto já saiu do seu bolso e mantenha o orçamento em dia.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-new-transaction-btn",
                    popover: {
                        title: "Registre em Segundos",
                        description: "Comprou um café ou recebeu um pix? Clique aqui para registrar receitas e despesas rapidamente e manter tudo organizado.",
                        side: "left",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-ai-card",
                    popover: {
                        title: "Sua Assistente Pessoal 🤖",
                        description: "Esta é a joia da coroa! Nossa IA analisa seus hábitos de consumo 24/7 e te dá dicas personalizadas de onde economizar e como investir melhor.",
                        side: "top",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-forecast-card",
                    popover: {
                        title: "Olhe para o Futuro 🔮",
                        description: "Não olhe apenas para o passado. Com base nos seus gastos fixos e parcelas, nós projetamos como estará seu saldo nos próximos meses para você não ter surpresas.",
                        side: "top",
                        align: "start",
                    },
                },
                {
                    element: "#dashboard-insights-carousel",
                    popover: {
                        title: "Gráficos e Metas",
                        description: "Deslize para o lado para ver gráficos visuais de suas despesas por categoria, acompanhar o progresso das suas metas financeiras e ver sua evolução mensal.",
                        side: "top",
                        align: "start",
                    },
                },
                {
                    element: "#sidebar-menu",
                    popover: {
                        title: "Explore o Sistema",
                        description: "Acesse a gestão detalhada de seus Cartões de Crédito, Contas Bancárias, Metas e Relatórios Avançados através deste menu.",
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
