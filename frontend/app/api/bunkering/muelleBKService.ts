import apiClient from "../apiClient";

export const getMuelleBK = async (id: string) => {
  const response = await apiClient.get(`bunkering/muelleBK/${id}`);
  return response.data;
};
export const getMuellesBK = async () => {
  const response = await apiClient.get("bunkering/muelleBK");
  return response.data;
};
export const createMuelleBK = async (data: any) => {
  const response = await apiClient.post("bunkering/muelleBK", data);
  return response.data;
};
export const updateMuelleBK = async (id: string, data: any) => {
  const response = await apiClient.put(`bunkering/muelleBK/${id}`, data);
  return response.data;
};
export const deleteMuelleBK = async (id: string) => {
  const response = await apiClient.delete(`bunkering/muelleBK/${id}`);
  return response.data;
};
