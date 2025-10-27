import apiClient from "../apiClient";

export const getChequeoCalidadBK = async (id: string) => {
  const response = await apiClient.get(`bunkering/chequeoCalidadBK/${id}`);
  return response.data;
};
export const getChequeoCalidadsBK = async () => {
  const response = await apiClient.get("bunkering/chequeoCalidadBK");
  return response.data;
};
export const createChequeoCalidadBK = async (data: any) => {
  const response = await apiClient.post("bunkering/chequeoCalidadBK", data);
  return response.data;
};
export const updateChequeoCalidadBK = async (id: string, data: any) => {
  const response = await apiClient.put(
    `bunkering/chequeoCalidadBK/${id}`,
    data
  );
  return response.data;
};
export const deleteChequeoCalidadBK = async (id: string) => {
  const response = await apiClient.delete(`bunkering/chequeoCalidadBK/${id}`);
  return response.data;
};
