import apiClient from "../apiClient";

export const getLineaRecepcionBK = async (id: string) => {
  const response = await apiClient.get(`bunkering/lineaCargaBK/${id}`);
  return response.data;
};
export const getLineaRecepcionsBK = async () => {
  const response = await apiClient.get("bunkering/lineaCargaBK");
  return response.data;
};
export const createLineaRecepcionBK = async (data: any) => {
  const response = await apiClient.post("bunkering/lineaCargaBK", data);
  return response.data;
};
export const updateLineaRecepcionBK = async (id: string, data: any) => {
  const response = await apiClient.put(`bunkering/lineaCargaBK/${id}`, data);
  return response.data;
};
export const deleteLineaRecepcionBK = async (id: string) => {
  const response = await apiClient.delete(`bunkering/lineaCargaBK/${id}`);
  return response.data;
};
