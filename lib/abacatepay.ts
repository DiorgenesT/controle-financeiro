const BASE_URL = "https://api.abacatepay.com/v1";

interface CreateBillingParams {
    frequency: "ONE_TIME";
    methods: ["PIX"];
    products: Array<{
        externalId: string;
        name: string;
        quantity: number;
        price: number; // in cents
        description: string;
    }>;
    returnUrl: string;
    completionUrl: string;
    customer: {
        email: string;
        name: string;
        taxId: string;
    };
}

interface AbacatePayResponse {
    data: {
        id: string;
        url: string;
        // add other fields as needed
    };
    error?: string;
}

export const abacatePay = {
    billing: {
        create: async (data: CreateBillingParams) => {
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

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `AbacatePay API Error: ${response.statusText}`);
            }

            const responseData = await response.json();
            return responseData.data;
        }
    }
};
