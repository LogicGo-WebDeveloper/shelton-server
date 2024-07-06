import axiosInstance from "../../config/axios.config.js";

const getCountryLeagueList = async (sport) => {
  const { data } = await axiosInstance.get(`/api/v1/sport/${sport}/categories`);

  return data.categories;
};

const getSportList = async (timezoneOffset = 0) => {
  const { data } = await axiosInstance.get(
    `/api/v1/sport/${timezoneOffset}/event-count`
  );

  return data;
};

const getAllMatches = async (sport, date) => {
  const { data } = await axiosInstance.get(`/api/v1/sport/${sport}/scheduled-events/2024-06-22`);
  return data;
};


const getLeagueTournamentList = async (id) => {
  const { data } = await axiosInstance.get(`/api/v1/category/${id}/unique-tournaments`);

  return data.groups?.[0]?.uniqueTournaments ?? [];
};

export default {
  getCountryLeagueList,
  getSportList,
  getAllMatches,
  getLeagueTournamentList
};
