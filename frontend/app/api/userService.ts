import apiClient from "./apiClient";

export const getUser = async (id: string) => {
  console.log(`Fetching user with ID: ${id}`);
  const response = await apiClient.get(`/usuarios/${id}`);
  console.log(`User data fetched:`, response.data);
  return response.data;
};

export const getUsers = async () => {
  const response = await apiClient.get("/usuarios");
  return response.data;
};

export const createUser = async (data: any) => {
  const response = await apiClient.post("/usuarios", data);
  return response.data;
};

export const updateUser = async (id: string, data: any) => {
  const response = await apiClient.put(`/usuarios/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await apiClient.delete(`/usuarios/${id}`);
  return response.data;
};

export const loginUser = async (data: any) => {
  const response = await apiClient.post("/auth/login", data);
  return response.data;
};

export const googleSingIn = async (data: any) => {
  const response = await apiClient.post("/auth/google", data);
  return response.data;
};

export const registerUser = async (data: any) => {
  const response = await apiClient.post("/auth/register", data);
  return response.data;
};
