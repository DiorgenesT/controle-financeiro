import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Transaction, Account } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTransactionDescription(transaction: Transaction, accounts: Account[]) {
  if (transaction.category === "Transferência" || transaction.description.includes("Transferência")) {
    // Caso 1: Transferência de saída (Transferência para: Destino - Descrição)
    if (transaction.description.startsWith("Transferência para: ")) {
      const parts = transaction.description.replace("Transferência para: ", "").split(" - ");
      const targetName = parts[0];
      const sourceAccount = accounts.find(a => a.id === transaction.accountId);
      return `Trf. ${sourceAccount?.name || "?"} -> ${targetName}`;
    }

    // Caso 2: Transferência de entrada (Recebido de: Origem - Descrição)
    if (transaction.description.startsWith("Recebido de: ")) {
      const parts = transaction.description.replace("Recebido de: ", "").split(" - ");
      const sourceName = parts[0];
      const targetAccount = accounts.find(a => a.id === transaction.accountId);
      return `Trf. ${sourceName} -> ${targetAccount?.name || "?"}`;
    }

    // Caso 3: Fallback para descrição genérica
    if (transaction.description === "Transferência entre contas") {
      return "Trf. Própria";
    }

    // Caso 4: Se for transferência mas não cair nos padrões acima, tenta abreviar
    return "Trf. " + transaction.description.replace("Transferência ", "");
  }

  return transaction.description;
}
