import apiClient from "../apiClient";

export const getContratoBK = async (id: string) => {
  const response = await apiClient.get(`bunkering/contratoBK/${id}`);
  return response.data;
};
export const getContratosBK = async () => {
  const response = await apiClient.get("bunkering/contratoBK");
  return response.data;
};
export const createContratoBK = async (data: any) => {
  const response = await apiClient.post("bunkering/contratoBK", data);
  return response.data;
};
export const updateContratoBK = async (id: string, data: any) => {
  const response = await apiClient.put(`bunkering/contratoBK/${id}`, data);
  return response.data;
};
export const deleteContratoBK = async (id: string) => {
  const response = await apiClient.delete(`bunkering/contratoBK/${id}`);
  return response.data;
};
