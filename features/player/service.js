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

const getNationalTeamStatistics = async (id) => {
  const { data } = await axiosInstance.get(
    `/api/v1/player/${id}/national-team-statistics`
  );
  return data ?? [];
};

const getPlayerImage = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/api/v1/player/${id}/image`);
    return data ?? [];
  } catch (error) {
    return null
  }
};

export default {
  getPlayerById,
  getPlayerMatchesById,
  getNationalTeamStatistics,
  getPlayerImage,
};
