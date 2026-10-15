import api from "./axiosClient";

// export const getUsers = async () => {
//   const { data } = await api.get(`/users`);
//   return data;
// };

// export const getUserById = async (id: String) => {
//   const { data } = await api.get(`/users/${id}`);
//   return data;
// };

export const postUser = async (userData: any) => {
  const { data } = await api.post(`/users/register`, userData);
  return data;
};

// export const updateUser = async (id: String, payload: any) => {
//   const { data } = await api.put(`/users/${id}`, payload);
//   return data;
// };

// export const deleteUser = async (id: String) => {
//   const { data } = await api.delete(`/users/${id}`);
//   return data;
// };
