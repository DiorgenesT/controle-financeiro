import { useState, useEffect } from 'react';

export interface MarketData {
    code: string;
    codein: string;
    name: string;
    high: string;
    low: string;
    varBid: string;
    pctChange: string;
    bid: string;
    ask: string;
    timestamp: string;
    create_date: string;
}

export interface MarketResponse {
    USDBRL: MarketData;
    EURBRL: MarketData;
    BTCBRL: MarketData;
    ETHBRL: MarketData;
}

export function useMarketData() {
    const [data, setData] = useState<MarketResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL');
            if (!response.ok) {
                throw new Error('Failed to fetch market data');
            }
            const json = await response.json();
            setData(json);
            setError(null);
        } catch (err) {
            console.error('Error fetching market data:', err);
            setError('Erro ao carregar cotações');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Update every 60 seconds
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    return { data, loading, error, refetch: fetchData };
}
