import apiClient from "../apiClient";

export const getProductoBK = async (id: string) => {
  const response = await apiClient.get(`bunkering/productoBK/${id}`);
  return response.data;
};
export const getProductosBK = async () => {
  const response = await apiClient.get("bunkering/productoBK");
  return response.data;
};
export const createProductoBK = async (data: any) => {
  const response = await apiClient.post("bunkering/productoBK", data);
  return response.data;
};
export const updateProductoBK = async (id: string, data: any) => {
  const response = await apiClient.put(`bunkering/productoBK/${id}`, data);
  return response.data;
};
export const deleteProductoBK = async (id: string) => {
  const response = await apiClient.delete(`bunkering/productoBK/${id}`);
  return response.data;
};
