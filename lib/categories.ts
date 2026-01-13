import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp,
    writeBatch
} from "firebase/firestore";
import { db } from "./firebase";

export interface Category {
    id: string;
    name: string;
    type: "receita" | "despesa";
    icon: string;
    color: string;
    userId: string;
    isDefault?: boolean;
    createdAt?: Date;
}

// Categorias padrão que serão criadas para novos usuários
const DEFAULT_CATEGORIES: Omit<Category, "id" | "userId" | "createdAt">[] = [
    // ============ RECEITAS ============
    { name: "Salário", type: "receita", icon: "briefcase", color: "#10B981", isDefault: true },
    { name: "Freelance", type: "receita", icon: "monitor", color: "#3B82F6", isDefault: true },
    { name: "Investimentos", type: "receita", icon: "piggybank", color: "#8B5CF6", isDefault: true },
    { name: "Dividendos", type: "receita", icon: "trendingup", color: "#22C55E", isDefault: true },
    { name: "Aluguel", type: "receita", icon: "building", color: "#F59E0B", isDefault: true },
    { name: "Vendas", type: "receita", icon: "shoppingbag", color: "#EC4899", isDefault: true },
    { name: "Bônus", type: "receita", icon: "gift", color: "#F97316", isDefault: true },
    { name: "Cashback", type: "receita", icon: "percent", color: "#14B8A6", isDefault: true },
    { name: "Outros", type: "receita", icon: "coins", color: "#6B7280", isDefault: true },

    // ============ DESPESAS ============
    // Essenciais
    { name: "Alimentação", type: "despesa", icon: "utensils", color: "#EF4444", isDefault: true },
    { name: "Supermercado", type: "despesa", icon: "shoppingcart", color: "#F97316", isDefault: true },
    { name: "Moradia", type: "despesa", icon: "home", color: "#EC4899", isDefault: true },
    { name: "Aluguel", type: "despesa", icon: "landmark", color: "#A855F7", isDefault: true },
    { name: "Condomínio", type: "despesa", icon: "building2", color: "#8B5CF6", isDefault: true },
    { name: "Água", type: "despesa", icon: "droplet", color: "#0EA5E9", isDefault: true },
    { name: "Luz", type: "despesa", icon: "lightbulb", color: "#EAB308", isDefault: true },
    { name: "Gás", type: "despesa", icon: "flame", color: "#F59E0B", isDefault: true },

    // Transporte
    { name: "Transporte", type: "despesa", icon: "car", color: "#F59E0B", isDefault: true },
    { name: "Combustível", type: "despesa", icon: "fuel", color: "#78716C", isDefault: true },
    { name: "Uber/99", type: "despesa", icon: "navigation", color: "#3B82F6", isDefault: true },
    { name: "Estacionamento", type: "despesa", icon: "mappin", color: "#64748B", isDefault: true },

    // Comunicação
    { name: "Internet", type: "despesa", icon: "wifi", color: "#06B6D4", isDefault: true },
    { name: "Telefone", type: "despesa", icon: "phone", color: "#8B5CF6", isDefault: true },

    // Saúde
    { name: "Saúde", type: "despesa", icon: "heart", color: "#14B8A6", isDefault: true },
    { name: "Farmácia", type: "despesa", icon: "pill", color: "#10B981", isDefault: true },
    { name: "Academia", type: "despesa", icon: "dumbbell", color: "#84CC16", isDefault: true },
    { name: "Plano de Saúde", type: "despesa", icon: "stethoscope", color: "#22C55E", isDefault: true },

    // Educação
    { name: "Educação", type: "despesa", icon: "graduation", color: "#3B82F6", isDefault: true },
    { name: "Cursos", type: "despesa", icon: "book", color: "#6366F1", isDefault: true },
    { name: "Livros", type: "despesa", icon: "book", color: "#8B5CF6", isDefault: true },

    // Lazer e Entretenimento
    { name: "Lazer", type: "despesa", icon: "gamepad", color: "#A855F7", isDefault: true },
    { name: "Restaurante", type: "despesa", icon: "utensils", color: "#EF4444", isDefault: true },
    { name: "Bar", type: "despesa", icon: "beer", color: "#F97316", isDefault: true },
    { name: "Cinema", type: "despesa", icon: "film", color: "#EC4899", isDefault: true },
    { name: "Streaming", type: "despesa", icon: "tv", color: "#F43F5E", isDefault: true },
    { name: "Viagem", type: "despesa", icon: "plane", color: "#0EA5E9", isDefault: true },

    // Compras
    { name: "Compras", type: "despesa", icon: "shoppingbag", color: "#EC4899", isDefault: true },
    { name: "Vestuário", type: "despesa", icon: "shirt", color: "#D946EF", isDefault: true },
    { name: "Eletrônicos", type: "despesa", icon: "laptop", color: "#6366F1", isDefault: true },
    { name: "Beleza", type: "despesa", icon: "sparkles", color: "#F472B6", isDefault: true },

    // Família e Casa
    { name: "Pet", type: "despesa", icon: "dog", color: "#78350F", isDefault: true },
    { name: "Presente", type: "despesa", icon: "gift", color: "#EC4899", isDefault: true },
    { name: "Manutenção", type: "despesa", icon: "wrench", color: "#64748B", isDefault: true },

    // Financeiro
    { name: "Contas", type: "despesa", icon: "receipt", color: "#64748B", isDefault: true },
    { name: "Cartão de Crédito", type: "despesa", icon: "creditcard", color: "#3B82F6", isDefault: true },
    { name: "Empréstimo", type: "despesa", icon: "handcoins", color: "#EF4444", isDefault: true },
    { name: "Seguros", type: "despesa", icon: "shield", color: "#22C55E", isDefault: true },
    { name: "Impostos", type: "despesa", icon: "landmark", color: "#78716C", isDefault: true },

    // Outros
    { name: "Assinaturas", type: "despesa", icon: "zap", color: "#F43F5E", isDefault: true },
    { name: "Doação", type: "despesa", icon: "hearthand", color: "#EC4899", isDefault: true },
    { name: "Outros", type: "despesa", icon: "other", color: "#6B7280", isDefault: true },
];

// Inicializa categorias padrão para um novo usuário
export async function initializeDefaultCategories(userId: string): Promise<void> {
    // Verificar se já existem categorias para o usuário
    const q = query(collection(db, "categories"), where("userId", "==", userId));
    const snapshot = await getDocs(q);

    // Se já tem categorias, não precisa criar
    if (!snapshot.empty) return;

    // Criar categorias padrão em batch
    const batch = writeBatch(db);

    for (const category of DEFAULT_CATEGORIES) {
        const docRef = doc(collection(db, "categories"));
        batch.set(docRef, {
            ...category,
            userId,
            createdAt: serverTimestamp(),
        });
    }

    await batch.commit();
}

// Buscar todas as categorias do usuário
export async function getCategories(userId: string): Promise<Category[]> {
    const q = query(
        collection(db, "categories"),
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Category[];
}

// Adicionar nova categoria
export async function addCategory(
    userId: string,
    data: Omit<Category, "id" | "userId" | "createdAt">
): Promise<string> {
    const docRef = await addDoc(collection(db, "categories"), {
        ...data,
        userId,
        isDefault: false,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

// Atualizar categoria
export async function updateCategory(
    categoryId: string,
    data: Partial<Omit<Category, "id" | "userId">>
): Promise<void> {
    const docRef = doc(db, "categories", categoryId);
    await updateDoc(docRef, data);
}

// Excluir categoria
export async function deleteCategory(categoryId: string): Promise<void> {
    await deleteDoc(doc(db, "categories", categoryId));
}
