import api from "@/lib/api";

export interface InvoiceItem {
  description: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  discountType: "FLAT" | "PERCENTAGE";
  discountValue: number;
  discountAmount: number;
  amount: number;
}

export interface InvoiceData {
  customerName: string;
  customerAddress: string;
  customerGstin?: string;
  placeOfSupply?: string;
  items: InvoiceItem[];
  subTotal: number;
  discountType: "FLAT" | "PERCENTAGE";
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  dueDate?: Date;
  type?: "TAX_INVOICE" | "PROFORMA";
}

export const InvoiceService = {
  // Get all invoices
  getAll: async () => {
    const { data } = await api.get("/invoices");
    return data;
  },

  // Get single invoice
  getById: async (id: string) => {
    const { data } = await api.get(`/invoices/${id}`);
    return data;
  },

  // Create invoice
  create: async (invoiceData: InvoiceData) => {
    const { data } = await api.post("/invoices", invoiceData);
    return data;
  },
};
