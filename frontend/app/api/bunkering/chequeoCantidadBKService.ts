import apiClient from "../apiClient";

export const getChequeoCantidadBK = async (id: string) => {
  const response = await apiClient.get(`bunkering/chequeoCantidadBK/${id}`);
  return response.data;
};
export const getChequeoCantidadsBK = async () => {
  const response = await apiClient.get("bunkering/chequeoCantidadBK");
  return response.data;
};
export const createChequeoCantidadBK = async (data: any) => {
  const response = await apiClient.post("bunkering/chequeoCantidadBK", data);
  return response.data;
};
export const updateChequeoCantidadBK = async (id: string, data: any) => {
  const response = await apiClient.put(
    `bunkering/chequeoCantidadBK/${id}`,
    data
  );
  return response.data;
};
export const deleteChequeoCantidadBK = async (id: string) => {
  const response = await apiClient.delete(`bunkering/chequeoCantidadBK/${id}`);
  return response.data;
};
