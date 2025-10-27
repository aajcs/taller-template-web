import apiClient from "../apiClient";

export const getTipoProductoBK = async (id: string) => {
  const response = await apiClient.get(`bunkering/tipoProductoBK/${id}`);
  return response.data;
};
export const getTipoProductosBK = async () => {
  const response = await apiClient.get("bunkering/tipoProductoBK");
  return response.data;
};
export const createTipoProductoBK = async (data: any) => {
  const response = await apiClient.post("bunkering/tipoProductoBK", data);
  return response.data;
};
export const updateTipoProductoBK = async (id: string, data: any) => {
  const response = await apiClient.put(`bunkering/tipoProductoBK/${id}`, data);
  return response.data;
};
export const deleteTipoProductoBK = async (id: string) => {
  const response = await apiClient.delete(`bunkering/tipoProductoBK/${id}`);
  return response.data;
};
