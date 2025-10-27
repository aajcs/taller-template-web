import apiClient from "../apiClient";

export const getEmbarcacionBK = async (id: string) => {
  const response = await apiClient.get(`bunkering/embarcacionBK/${id}`);
  return response.data;
};
export const getEmbarcacionsBK = async () => {
  const response = await apiClient.get("bunkering/embarcacionBK");
  return response.data;
};
export const createEmbarcacionBK = async (data: any) => {
  const response = await apiClient.post("bunkering/embarcacionBK", data);
  return response.data;
};
export const updateEmbarcacionBK = async (id: string, data: any) => {
  const response = await apiClient.put(`bunkering/embarcacionBK/${id}`, data);
  return response.data;
};
export const deleteEmbarcacionBK = async (id: string) => {
  const response = await apiClient.delete(`bunkering/embarcacionBK/${id}`);
  return response.data;
};
