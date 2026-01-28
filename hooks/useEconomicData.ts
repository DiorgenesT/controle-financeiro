import { useState, useEffect } from 'react';

export interface EconomicIndicator {
    name: string;
    value: number;
    date: string;
    code: number;
}

export interface EconomicData {
    selic: EconomicIndicator | null;
    ipca: EconomicIndicator | null;
    cdi: EconomicIndicator | null;
    poupanca: EconomicIndicator | null;
}

export function useEconomicData() {
    const [data, setData] = useState<EconomicData>({
        selic: null,
        ipca: null,
        cdi: null,
        poupanca: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchIndicator = async (code: number, name: string): Promise<EconomicIndicator | null> => {
        try {
            const today = new Date();
            const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

            // Format dates as DD/MM/YYYY
            const formatDate = (date: Date) => {
                return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            };

            const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${formatDate(lastYear)}&dataFinal=${formatDate(today)}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${name}`);

            const json = await response.json();
            if (json && json.length > 0) {
                const lastEntry = json[json.length - 1];
                return {
                    name,
                    value: parseFloat(lastEntry.valor),
                    date: lastEntry.data,
                    code
                };
            }
            return null;
        } catch (err) {
            console.error(`Error fetching ${name}:`, err);
            return null;
        }
    };

    const fetchData = async () => {
        try {
            // 432: Meta Selic (anual)
            // 13522: IPCA acumulado 12 meses (ou 433 mensal e somar, mas 13522 é mais direto se disponível, senão 433)
            // Vamos usar 433 (mensal) e pegar o último valor mensal, ou tentar buscar o acumulado.
            // Para simplificar e garantir dados, vamos pegar:
            // Selic Meta (432) -> Taxa atual
            // IPCA Mensal (433) -> Última inflação mensal (multiplicar por 12 visualmente ou mostrar mensal)
            // CDI (12) -> Taxa diária ou mensal. A série 4389 é CDI acumulado mensal.
            // Poupança (195) -> Rendimento mensal.

            const [selic, ipca, cdi, poupanca] = await Promise.all([
                fetchIndicator(432, 'Selic'),
                fetchIndicator(433, 'IPCA (Mensal)'), // IPCA Mensal
                fetchIndicator(4389, 'CDI (Mensal)'), // CDI Mensal
                fetchIndicator(195, 'Poupança') // Poupança Mensal
            ]);

            setData({ selic, ipca, cdi, poupanca });
            setError(null);
        } catch (err) {
            console.error('Error fetching economic data:', err);
            setError('Erro ao carregar indicadores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Update every hour
        const interval = setInterval(fetchData, 3600000);
        return () => clearInterval(interval);
    }, []);

    return { data, loading, error, refetch: fetchData };
}
