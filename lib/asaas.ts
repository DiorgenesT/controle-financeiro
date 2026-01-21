const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://api.asaas.com/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

interface Customer {
    id?: string;
    name: string;
    email: string;
    cpfCnpj: string;
    mobilePhone?: string;
}

interface Payment {
    customer: string;
    billingType: "PIX" | "CREDIT_CARD" | "BOLETO";
    value: number;
    dueDate: string;
    description?: string;
    externalReference?: string;
}

export const asaas = {
    customers: {
        create: async (customer: Customer) => {
            // First try to find existing customer by CPF
            const searchResponse = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${customer.cpfCnpj}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "access_token": ASAAS_API_KEY!,
                },
            });

            const searchData = await searchResponse.json();
            if (searchData.data && searchData.data.length > 0) {
                return searchData.data[0];
            }

            // If not found, create new
            const response = await fetch(`${ASAAS_API_URL}/customers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "access_token": ASAAS_API_KEY!,
                },
                body: JSON.stringify(customer),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(JSON.stringify(error));
            }

            return response.json();
        },
    },

    payments: {
        create: async (payment: Payment) => {
            const response = await fetch(`${ASAAS_API_URL}/payments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "access_token": ASAAS_API_KEY!,
                },
                body: JSON.stringify(payment),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(JSON.stringify(error));
            }

            return response.json();
        },
    },
};
