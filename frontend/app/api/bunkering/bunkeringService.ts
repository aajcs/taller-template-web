import apiClient from "../apiClient";

export const getBunkering = async (id: string) => {
  const response = await apiClient.get(`/bunkering/bunkering/${id}`);
  return response.data;
};

export const getBunkerings = async () => {
  const response = await apiClient.get("/bunkering/bunkering");
  return response.data;
};

export const createBunkering = async (data: any) => {
  const response = await apiClient.post("/bunkering/bunkering", data);
  return response.data;
};

export const updateBunkering = async (id: string, data: any) => {
  const response = await apiClient.put(`/bunkering/bunkering/${id}`, data);
  return response.data;
};

export const deleteBunkering = async (id: string) => {
  const response = await apiClient.delete(`/bunkering/bunkering/${id}`);
  return response.data;
};
