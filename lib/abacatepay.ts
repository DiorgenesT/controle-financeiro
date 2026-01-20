const BASE_URL = "https://api.abacatepay.com/v1";

interface Product {
    externalId: string;
    name: string;
    quantity: number;
    price: number;
    description?: string;
}

interface CustomerData {
    name: string;
    email: string;
    cellphone: string;
    taxId: string;
}

interface CreateBillingParams {
    frequency: "ONE_TIME";
    methods: string[];
    products: Product[];
    returnUrl: string;
    completionUrl: string;
    customer: CustomerData;
}

interface Billing {
    id: string;
    url: string;
}

async function apiRequest<T>(endpoint: string, data: object): Promise<T> {
    if (!process.env.ABACATEPAY_API_KEY) {
        throw new Error("Missing ABACATEPAY_API_KEY");
    }

    console.log("AbacatePay Request:", endpoint, JSON.stringify(data));

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.ABACATEPAY_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const responseData = await response.json();
    console.log("AbacatePay Response:", JSON.stringify(responseData));

    if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || `AbacatePay API Error: ${response.status}`);
    }

    return responseData.data;
}

export const abacatePay = {
    billing: {
        create: async (data: CreateBillingParams): Promise<Billing> => {
            return apiRequest<Billing>("/billing/create", data);
        }
    }
};
