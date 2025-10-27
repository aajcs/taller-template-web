import apiClient from "../apiClient";

export const getRecepcionBK = async (id: string) => {
  const response = await apiClient.get(`bunkering/recepcionBK/${id}`);
  return response.data;
};
export const getRecepcionsBK = async () => {
  const response = await apiClient.get("bunkering/recepcionBK");
  return response.data;
};
export const createRecepcionBK = async (data: any) => {
  const response = await apiClient.post("bunkering/recepcionBK", data);
  return response.data;
};
export const updateRecepcionBK = async (id: string, data: any) => {
  const response = await apiClient.put(`bunkering/recepcionBK/${id}`, data);
  return response.data;
};
export const deleteRecepcionBK = async (id: string) => {
  const response = await apiClient.delete(`bunkering/recepcionBK/${id}`);
  return response.data;
};
