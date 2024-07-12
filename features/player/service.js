import axiosInstance from "../../config/axios.config.js";

const getPlayerById = async (id) => {
  const { data } = await axiosInstance.get(`/api/v1/player/${id}`);

  return data ?? [];
};

const getPlayerMatchesById = async (id, span, page) => {
  const { data } = await axiosInstance.get(
    `/api/v1/player/${id}/events/${span}/${page}`
  );

  return data ?? [];
};

const getPlayerImage = async (id) => {
  const { data } = await axiosInstance.get(`/api/v1/player/${id}/image`);

  return data ?? [];
};

export default {
  getPlayerById,
  getPlayerMatchesById,
  getPlayerImage,
};
