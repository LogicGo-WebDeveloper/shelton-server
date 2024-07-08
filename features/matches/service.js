import axiosInstance from "../../config/axios.config.js";

const getSingleMatchDetail = async (matchId) => {
  const { data } = await axiosInstance.get(`/api/v1/event/${matchId}`);
  return data;
};

const getScorecard = async (matchId) => {
  const { data } = await axiosInstance.get(`/api/v1/event/${matchId}/innings`);
  return data;
};

const getSquad = async (matchId) => {
  const { data } = await axiosInstance.get(`/api/v1/event/${matchId}/lineups`);
  return data;
};

const getOvers = async (matchId) => {
  const { data } = await axiosInstance.get(
    `/api/v1/event/${matchId}/incidents`
  );
  return data;
};

const getMatches = async (customId) => {
  const { data } = await axiosInstance.get(
    `/api/v1/event/${customId}/h2h/events`
  );
  return data;
};

const getVotes = async (matchId) => {
  const { data } = await axiosInstance.get(`/api/v1/event/${matchId}/votes`);
  return data;
};

const getMatchOdds = async (matchId) => {
  const { data } = await axiosInstance.get(
    `/api/v1/event/${matchId}/odds/1/all`
  );
  return data;
};

const getPregameForm = async (matchId) => {
  const { data } = await axiosInstance.get(
    `/api/v1/event/${matchId}/pregame-form`
  );
  return data;
};

const getSeasonStandingsByTeams = async (id, seasonId) => {
  const { data } = await axiosInstance.get(
    `/api/v1/tournament/${id}/season/${seasonId}/standings/total`
  );

  return data ?? [];
};

const getMatchH2H = async (matchId) => {
  const { data } = await axiosInstance.get(`/api/v1/event/${matchId}/h2h`);
  return data;
};

export default {
  getSingleMatchDetail,
  getScorecard,
  getSquad,
  getOvers,
  getMatches,
  getVotes,
  getMatchOdds,
  getPregameForm,
  getSeasonStandingsByTeams,
  getMatchH2H
};
