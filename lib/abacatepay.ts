const BASE_URL = "https://api.abacatepay.com/v1";

interface Product {
    externalId: string;
    name: string;
    quantity: number;
    price: number; // in cents
    description?: string;
}

interface CreateBillingParams {
    frequency: "ONE_TIME";
    methods: string[];
    products: Product[];
    returnUrl: string;
    completionUrl: string;
    customerId?: string;
}

export const abacatePay = {
    billing: {
        create: async (data: CreateBillingParams): Promise<{ id: string; url: string }> => {
            if (!process.env.ABACATEPAY_API_KEY) {
                throw new Error("Missing ABACATEPAY_API_KEY");
            }

            const response = await fetch(`${BASE_URL}/billing/create`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.ABACATEPAY_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error("AbacatePay Error Response:", JSON.stringify(responseData));
                throw new Error(responseData.error || responseData.message || `AbacatePay API Error: ${response.status}`);
            }

            return responseData.data || responseData;
        }
    }
};
