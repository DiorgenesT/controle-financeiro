const ABACATEPAY_URL = "https://api.abacatepay.com/v1";

interface Customer {
    email: string;
    name?: string;
    cellphone?: string;
    taxId?: string;
}

interface BillingProduct {
    externalId: string;
    name: string;
    quantity: number;
    price: number;
    description?: string;
}

interface CreateBillingParams {
    frequency: "ONE_TIME" | "MONTHLY" | "YEARLY";
    methods: string[];
    products: BillingProduct[];
    returnUrl: string;
    completionUrl: string;
    customer: Customer;
}

export const abacatePay = {
    billing: {
        create: async (data: CreateBillingParams, apiKey: string) => {
            const response = await fetch(`${ABACATEPAY_URL}/billing/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: "Unknown error" }));
                throw new Error(error.message || `AbacatePay Error: ${response.statusText}`);
            }

            return response.json();
        },
    },
};
