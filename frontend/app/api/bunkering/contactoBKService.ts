import apiClient from "../apiClient";

export const getContactoBK = async (id: string) => {
  const response = await apiClient.get(`bunkering/contactoBK/${id}`);
  return response.data;
};
export const getContactosBK = async () => {
  const response = await apiClient.get("bunkering/contactoBK");
  return response.data;
};
export const createContactoBK = async (data: any) => {
  const response = await apiClient.post("bunkering/contactoBK", data);
  return response.data;
};
export const updateContactoBK = async (id: string, data: any) => {
  const response = await apiClient.put(`bunkering/contactoBK/${id}`, data);
  return response.data;
};
export const deleteContactoBK = async (id: string) => {
  const response = await apiClient.delete(`bunkering/contactoBK/${id}`);
  return response.data;
};
