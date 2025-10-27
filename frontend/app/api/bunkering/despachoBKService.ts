import apiClient from "../apiClient";

export const getDespachoBK = async (id: string) => {
  const response = await apiClient.get(`bunkering/despacho/${id}`);
  return response.data;
};
export const getDespachosBK = async () => {
  const response = await apiClient.get("bunkering/despacho");
  return response.data;
};
export const createDespachoBK = async (data: any) => {
  const response = await apiClient.post("bunkering/despacho", data);
  return response.data;
};
export const updateDespachoBK = async (id: string, data: any) => {
  const response = await apiClient.put(`bunkering/despacho/${id}`, data);
  return response.data;
};
export const deleteDespachoBK = async (id: string) => {
  const response = await apiClient.delete(`bunkering/despacho/${id}`);
  return response.data;
};
