import api from "@/lib/api";

export interface DirectoryUser {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
}

export const UserService = {
  // Get directory of all active users
  getDirectory: async () => {
    const { data } = await api.get("/users/directory");
    return data.data as DirectoryUser[];
  },
};
