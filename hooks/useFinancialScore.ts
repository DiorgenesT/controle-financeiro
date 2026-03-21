import { useState, useEffect } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { isSameMonth, subMonths } from "date-fns";
import { Transaction } from "@/types";

/**
 * Calcula receitas e despesas reais de um mês.
 * - Exclui Transferências (não representam ganho/perda real)
 * - Inclui TODAS as despesas (cartão de crédito, boleto, pix etc.)
 *   para refletir o gasto real, não apenas o que saiu da conta
 */
function getMonthlyStats(transactions: Transaction[], targetDate: Date) {
    const monthTxs = transactions.filter(
        (t) => isSameMonth(t.date, targetDate) && t.category !== "Transferência"
    );

    const receitas = monthTxs
        .filter((t) => t.type === "receita")
        .reduce((s, t) => s + t.amount, 0);

    // Despesa real = tudo que foi comprometido, incluindo cartão e boleto
    // Exceto boletos que ainda não foram gerados (parcelamentos futuros)
    const despesas = monthTxs
        .filter((t) => t.type === "despesa")
        .reduce((s, t) => s + t.amount, 0);

    return { receitas, despesas };
}

export interface FinancialScoreDetails {
    savingsScore: number;    // 0–350: Taxa de poupança (média 3 meses)
    stabilityScore: number;  // 0–300: Reserva de emergência (meses de runway)
    disciplineScore: number; // 0–200: Penalidades por boletos vencidos, saldo negativo
    trendScore: number;      // 0–150: Tendência: melhora ou piora mês a mês
}

export function useFinancialScore() {
    const { transactions, loading: loadingTransactions } = useTransactions();
    const { accounts, loading: loadingAccounts } = useAccounts();

    const [scoreData, setScoreData] = useState<{
        score: number;
        level: string;
        details: FinancialScoreDetails;
    }>({
        score: 0,
        level: "Calculando",
        details: {
            savingsScore: 0,
            stabilityScore: 0,
            disciplineScore: 0,
            trendScore: 0,
        },
    });

    useEffect(() => {
        if (loadingTransactions || loadingAccounts) return;

        const now = new Date();

        // ─────────────────────────────────────────────────────────────
        // Coletar dados dos últimos 3 meses
        // ─────────────────────────────────────────────────────────────
        const monthsData = [0, 1, 2].map((i) =>
            getMonthlyStats(transactions, subMonths(now, i))
        );

        // Apenas meses com alguma movimentação real
        const activeMonths = monthsData.filter(
            (m) => m.receitas > 0 || m.despesas > 0
        );

        const avgReceitas =
            activeMonths.length > 0
                ? activeMonths.reduce((s, m) => s + m.receitas, 0) / activeMonths.length
                : 0;

        // Média geral (inclui mês atual) — usada para taxa de poupança
        const avgDespesas =
            activeMonths.length > 0
                ? activeMonths.reduce((s, m) => s + m.despesas, 0) / activeMonths.length
                : 0;

        // Média apenas de meses COMPLETOS (meses[1] e meses[2])
        // Usada exclusivamente para o cálculo da reserva de emergência.
        // Evita distorção por mês atual parcial (ex: dia 5 com R$200 em vez de R$3.000).
        const completedMonths = monthsData.slice(1).filter((m) => m.despesas > 0);
        const avgDespesasCompleted =
            completedMonths.length > 0
                ? completedMonths.reduce((s, m) => s + m.despesas, 0) / completedMonths.length
                : avgDespesas; // fallback se não houver histórico

        // ─────────────────────────────────────────────────────────────
        // 1. TAXA DE POUPANÇA (0–350)
        // Meta: 40% de poupança = pontuação máxima.
        // Baseada na média dos últimos meses com movimentação.
        // ─────────────────────────────────────────────────────────────
        let savingsScore = 0;
        if (avgReceitas > 0) {
            const savingsRate = (avgReceitas - avgDespesas) / avgReceitas;
            savingsScore = Math.min(350, Math.max(0, (savingsRate / 0.4) * 350));
        }

        // ─────────────────────────────────────────────────────────────
        // 2. RESERVA DE EMERGÊNCIA (0–300)
        // Fórmula: reserva real / custo mensal médio (meses completos).
        // 6 meses de reserva = pontuação máxima (padrão internacional).
        //
        // Reserva real =
        //   savings + emergency  → dinheiro separado intencionalmente
        //   + checking/wallet    → apenas o que excede 1 mês de despesas
        //                          (o restante está "comprometido" com contas a pagar)
        //
        // Denominador = avgDespesasCompleted (meses anteriores concluídos)
        // para não distorcer pelo mês atual parcial.
        // ─────────────────────────────────────────────────────────────
        const reserveAccounts = accounts
            .filter((a) => a.type === "savings" || a.type === "emergency")
            .reduce((s, a) => s + Math.max(0, a.balance), 0);

        const operationalBalance = accounts
            .filter((a) => a.type === "checking" || a.type === "wallet")
            .reduce((s, a) => s + Math.max(0, a.balance), 0);

        // Porção do saldo corrente que excede 1 mês de gastos = buffer real de segurança
        const operationalBuffer = Math.max(0, operationalBalance - avgDespesasCompleted);

        const trueReserve = reserveAccounts + operationalBuffer;

        let stabilityScore = 0;
        if (avgDespesasCompleted > 0) {
            const monthsOfRunway = trueReserve / avgDespesasCompleted;
            stabilityScore = Math.min(300, (monthsOfRunway / 6) * 300);
        } else if (trueReserve > 0) {
            // Tem dinheiro mas sem histórico de despesas para medir → pontuação parcial
            stabilityScore = 150;
        }

        // ─────────────────────────────────────────────────────────────
        // 3. DISCIPLINA FINANCEIRA (0–200)
        // Começa em 200 e perde pontos por comportamentos problemáticos.
        // ─────────────────────────────────────────────────────────────
        let disciplineScore = 200;

        // Penalidade: boletos vencidos não pagos
        const overdueBoletos = transactions.filter(
            (t) =>
                t.paymentMethod === "boleto" &&
                t.boletoStatus === "pending" &&
                t.date < now
        );
        disciplineScore -= Math.min(100, overdueBoletos.length * 50);

        // Penalidade: contas com saldo negativo
        const negativeAccounts = accounts.filter((a) => a.balance < 0);
        disciplineScore -= Math.min(60, negativeAccounts.length * 30);

        // Penalidade: gastando mais do que ganha no mês atual
        const currentMonth = monthsData[0];
        if (currentMonth.receitas > 0 && currentMonth.despesas > currentMonth.receitas) {
            disciplineScore -= 40;
        }

        disciplineScore = Math.max(0, disciplineScore);

        // ─────────────────────────────────────────────────────────────
        // 4. TENDÊNCIA (0–150)
        // Compara a taxa de poupança do mês atual com o mês anterior.
        // Um bom score não basta — é preciso estar melhorando.
        // ─────────────────────────────────────────────────────────────
        let trendScore = 50; // Base neutra

        const prevMonth = monthsData[1];
        if (currentMonth.receitas > 0 && prevMonth.receitas > 0) {
            const currentRate =
                (currentMonth.receitas - currentMonth.despesas) / currentMonth.receitas;
            const prevRate =
                (prevMonth.receitas - prevMonth.despesas) / prevMonth.receitas;
            const delta = currentRate - prevRate;

            if (delta > 0.05) trendScore += 70;       // Melhorando muito
            else if (delta > 0) trendScore += 35;     // Melhorando
            else if (delta < -0.1) trendScore -= 40;  // Piorando bastante
            else if (delta < 0) trendScore -= 20;     // Piorando levemente
        }

        // Bônus: todos os meses disponíveis com poupança positiva
        const allPositive =
            activeMonths.length >= 2 &&
            activeMonths.every((m) => m.receitas > m.despesas);
        if (allPositive) trendScore += 30;

        trendScore = Math.max(0, Math.min(150, trendScore));

        // ─────────────────────────────────────────────────────────────
        // Score final
        // ─────────────────────────────────────────────────────────────
        const totalScore = Math.min(
            1000,
            Math.round(savingsScore + stabilityScore + disciplineScore + trendScore)
        );

        let level = "Crítico";
        if (totalScore >= 300) level = "Ruim";
        if (totalScore >= 500) level = "Razoável";
        if (totalScore >= 600) level = "Bom";
        if (totalScore >= 700) level = "Ótimo";
        if (totalScore >= 850) level = "Excelente";

        setScoreData({
            score: totalScore,
            level,
            details: {
                savingsScore,
                stabilityScore,
                disciplineScore,
                trendScore,
            },
        });
    }, [transactions, accounts, loadingTransactions, loadingAccounts]);

    return { scoreData, loading: loadingTransactions || loadingAccounts };
}
