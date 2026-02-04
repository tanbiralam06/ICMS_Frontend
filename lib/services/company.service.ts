import api from "@/lib/api";

interface OfficeLocation {
  _id?: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

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

  updateOfficeLocations: async (locations: OfficeLocation[]) => {
    const { data } = await api.patch("/company/locations", { officeLocations: locations });
    return data;
  },
};
