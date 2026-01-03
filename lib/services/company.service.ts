import api from "@/lib/api";

export const CompanyService = {
  getProfile: async () => {
    const { data } = await api.get("/company");
    return data;
  },

  upsertProfile: async (formData: FormData) => {
    // Content-Type is handled automatically by axios when passing FormData
    const { data } = await api.post("/company", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
};
