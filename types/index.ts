// Tipos do sistema
export interface UserSettings {
    budgetAlerts: boolean;
    goalReminders: boolean;
}

export interface User {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    isFirstAccess: boolean;
    createdAt: Date;
    subscriptionStatus: 'active' | 'inactive' | 'trial' | 'expired' | 'canceled';
    subscriptionEnd?: Date;
    stripeCustomerId?: string;
    settings?: UserSettings;
}

// ============ CONTAS BANCÁRIAS ============
export interface Account {
    id: string;
    userId: string;
    name: string;
    bankCode: string;
    type: 'checking' | 'savings' | 'wallet' | 'investment' | 'emergency';
    balance: number;
    color: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

// ============ CARTÕES DE CRÉDITO ============
export interface CreditCard {
    id: string;
    userId: string;
    name: string;
    bankCode: string;
    limit: number;
    closingDay: number;
    dueDay: number;
    color: string;
    lastFourDigits?: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface Person {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
}

export interface CreditCardInvoice {
    id: string;
    creditCardId: string;
    userId: string;
    month: number;
    year: number;
    totalAmount: number;
    status: 'open' | 'closed' | 'paid' | 'overdue';
    dueDate: Date;
    closingDate: Date;
    paidAt?: Date;
    paidFromAccountId?: string;
    createdAt: Date;
}

// ============ TRANSAÇÕES ============
export type PaymentMethod = 'debit' | 'credit' | 'boleto' | 'pix';
export type BoletoStatus = 'pending' | 'paid';

export interface Transaction {
    id: string;
    userId: string;
    type: 'receita' | 'despesa';
    amount: number;
    category: string;
    description: string;
    date: Date;
    createdAt: Date;
    updatedAt?: Date;

    // Campos de pagamento
    paymentMethod?: PaymentMethod;
    accountId?: string;

    // Cartão de crédito
    creditCardId?: string;
    invoiceId?: string;
    installments?: number;
    installmentNumber?: number;
    parentTransactionId?: string;
    totalAmount?: number;       // Valor total da compra (para parceladas)
    purchaseDate?: Date;        // Data original da compra (parcelas)

    // Boleto
    boletoStatus?: BoletoStatus;
    boletoDueDate?: Date;

    // Recorrência (Fixa)
    isRecurring?: boolean;
    recurrenceDay?: number | null;
    personId?: string | null;
    recurringTransactionId?: string | null;
}

export interface RecurringTransaction {
    id: string;
    userId: string;
    type: 'receita' | 'despesa';
    amount: number;
    category: string;
    description: string;
    day: number;
    active: boolean;
    personId?: string | null;

    // Forma de pagamento (para despesas)
    paymentMethod?: 'debit' | 'credit' | 'boleto' | 'pix';
    accountId?: string;       // Para débito/pix/boleto
    creditCardId?: string;    // Para cartão de crédito

    createdAt: Date;
    updatedAt?: Date;
    lastProcessedDate?: Date;
}

// ============ METAS ============
export interface Goal {
    id: string;
    userId: string;
    title: string;
    description?: string;
    icon?: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Date;
    linkedAccountId?: string;
    status: 'em_progresso' | 'concluida' | 'cancelada';
    createdAt: Date;
    updatedAt?: Date;
}

// ============ CATEGORIAS ============
export interface Category {
    id: string;
    name: string;
    type: 'receita' | 'despesa';
    icon?: string;
    color?: string;
}

// ============ ASSINATURA ============
export interface Subscription {
    id: string;
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    status: 'active' | 'canceled' | 'past_due' | 'unpaid';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    createdAt: Date;
}

// Categorias padrão (legacy - usar lib/categories.ts)
export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'salario', name: 'Salário', type: 'receita', icon: '💼', color: '#10B981' },
    { id: 'freelance', name: 'Freelance', type: 'receita', icon: '💻', color: '#3B82F6' },
    { id: 'investimentos', name: 'Investimentos', type: 'receita', icon: '📈', color: '#8B5CF6' },
    { id: 'outros_receita', name: 'Outros', type: 'receita', icon: '💰', color: '#6B7280' },
    { id: 'alimentacao', name: 'Alimentação', type: 'despesa', icon: '🍔', color: '#EF4444' },
    { id: 'transporte', name: 'Transporte', type: 'despesa', icon: '🚗', color: '#F59E0B' },
    { id: 'moradia', name: 'Moradia', type: 'despesa', icon: '🏠', color: '#EC4899' },
    { id: 'saude', name: 'Saúde', type: 'despesa', icon: '⚕️', color: '#14B8A6' },
    { id: 'educacao', name: 'Educação', type: 'despesa', icon: '📚', color: '#6366F1' },
    { id: 'lazer', name: 'Lazer', type: 'despesa', icon: '🎮', color: '#A855F7' },
    { id: 'compras', name: 'Compras', type: 'despesa', icon: '🛒', color: '#F97316' },
    { id: 'contas', name: 'Contas', type: 'despesa', icon: '📄', color: '#64748B' },
    { id: 'outros_despesa', name: 'Outros', type: 'despesa', icon: '💸', color: '#6B7280' },
];
