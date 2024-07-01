import axiosInstance from "../../config/axios.config.js";

const getTeamPerformance = async (id) => {
  const { data } = await axiosInstance.get(`/api/v1/team/${id}/performance`);

  return data ?? [];
};
const getTopPlayers = async (params) => {
  const { id, uniqueTournamentId, seasonId, type } = params;

  const { data } = await axiosInstance.get(
    `/api/v1/team/${id}/unique-tournament/${uniqueTournamentId}/season/${seasonId}/top-players/${type}`
  );

  return data.topPlayers ?? [];
};
const getTeamDetails = async (params) => {
  const { id } = params;

  const { data } = await axiosInstance.get(`/api/v1/team/${id}`);

  return data ?? [];
};
const getTeamPLayers = async (params) => {
  const { id } = params;

  const { data } = await axiosInstance.get(`/api/v1/team/${id}/players`);

  return data ?? [];
};

const getTeamMatchesByTeam = async (id, span, page) => {
  const { data } = await axiosInstance.get(
    `/api/v1/team/${id}/events/${span}/${page}`
  );

  return data ?? [];
};

const getTeamPlayerStatisticsSeasons = async (id) => {
  const { data } = await axiosInstance.get(`/api/v1/team/${id}/player-statistics/seasons`);
  return data ?? [];
};

const getTeamMedia = async (id) => {
  const { data } = await axiosInstance.get(`/api/v1/team/${id}/media`);
  return data ?? [];
};

const getTeamFeaturedEventsByTeams = async (id) => {
  const { data } = await axiosInstance.get(`/api/v1/team/${id}/near-events`);
  return data ?? [];
};

export default {
  getTeamPerformance,
  getTopPlayers,
  getTeamDetails,
  getTeamPLayers,
  getTeamMatchesByTeam,
  getTeamPlayerStatisticsSeasons,
  getTeamMedia,
  getTeamFeaturedEventsByTeams
};
