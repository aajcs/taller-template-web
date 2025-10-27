import apiClient from "../apiClient";

export const getTanqueBK = async (id: string) => {
  const response = await apiClient.get(`bunkering/tanqueBK/${id}`);
  return response.data;
};
export const getTanquesBK = async () => {
  const response = await apiClient.get("bunkering/tanqueBK");
  return response.data;
};
export const createTanqueBK = async (data: any) => {
  const response = await apiClient.post("bunkering/tanqueBK", data);
  return response.data;
};
export const updateTanqueBK = async (id: string, data: any) => {
  const response = await apiClient.put(`bunkering/tanqueBK/${id}`, data);
  return response.data;
};
export const deleteTanqueBK = async (id: string) => {
  const response = await apiClient.delete(`bunkering/tanqueBK/${id}`);
  return response.data;
};
