// Lista de bancos brasileiros com cores
export interface Bank {
    code: string;
    name: string;
    color: string;
    icon: string; // ícone do lib/icons.ts
}

export const BANKS: Bank[] = [
    { code: "nubank", name: "Nubank", color: "#8B5CF6", icon: "creditcard" },
    { code: "itau", name: "Itaú", color: "#FF6B00", icon: "landmark" },
    { code: "bradesco", name: "Bradesco", color: "#CC092F", icon: "landmark" },
    { code: "bb", name: "Banco do Brasil", color: "#FFCC00", icon: "landmark" },
    { code: "santander", name: "Santander", color: "#EC0000", icon: "landmark" },
    { code: "caixa", name: "Caixa", color: "#0066B3", icon: "landmark" },
    { code: "c6", name: "C6 Bank", color: "#1A1A1A", icon: "creditcard" },
    { code: "inter", name: "Inter", color: "#FF7A00", icon: "creditcard" },
    { code: "picpay", name: "PicPay", color: "#21C25E", icon: "wallet" },
    { code: "mercadopago", name: "Mercado Pago", color: "#009EE3", icon: "wallet" },
    { code: "neon", name: "Neon", color: "#00D4AA", icon: "creditcard" },
    { code: "next", name: "Next", color: "#00FF5F", icon: "creditcard" },
    { code: "original", name: "Banco Original", color: "#00A651", icon: "landmark" },
    { code: "btg", name: "BTG Pactual", color: "#1A1A4E", icon: "trendingup" },
    { code: "xp", name: "XP Investimentos", color: "#FFD100", icon: "trendingup" },
    { code: "rico", name: "Rico", color: "#FF6B00", icon: "trendingup" },
    { code: "clear", name: "Clear", color: "#00B8D4", icon: "trendingup" },
    { code: "pagbank", name: "PagBank", color: "#00A651", icon: "wallet" },
    { code: "iti", name: "Iti", color: "#FF6B35", icon: "wallet" },
    { code: "will", name: "Will Bank", color: "#FFD100", icon: "creditcard" },
    { code: "digio", name: "Digio", color: "#0066FF", icon: "creditcard" },
    { code: "sofisa", name: "Sofisa Direto", color: "#FF4500", icon: "creditcard" },
    { code: "modal", name: "Banco Modal", color: "#1A1A1A", icon: "landmark" },
    { code: "sicoob", name: "Sicoob", color: "#003366", icon: "landmark" },
    { code: "sicredi", name: "Sicredi", color: "#009639", icon: "landmark" },
    { code: "dinheiro", name: "Dinheiro/Carteira", color: "#22C55E", icon: "wallet" },
    { code: "outro", name: "Outro", color: "#6B7280", icon: "wallet" },
];

export const getBankByCode = (code: string): Bank => {
    return BANKS.find(b => b.code === code) || BANKS[BANKS.length - 1];
};

export const ACCOUNT_TYPES = [
    { value: "checking", label: "Conta Corrente" },
    { value: "savings", label: "Poupança" },
    { value: "wallet", label: "Carteira Digital" },
    { value: "investment", label: "Investimentos" },
    { value: "cash", label: "Dinheiro" },
    { value: "emergency", label: "Reserva de Emergência" },
] as const;

export const getAccountTypeLabel = (type: string): string => {
    return ACCOUNT_TYPES.find(t => t.value === type)?.label || type;
};
