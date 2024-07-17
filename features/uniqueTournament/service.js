import axiosInstance from "../../config/axios.config.js";

const getTournamentById = async (id) => {
  const { data } = await axiosInstance.get(`/api/v1/unique-tournament/${id}`);

  return data.uniqueTournament ?? [];
};

const getSeasonsByTournament = async (id) => {
  const { data } = await axiosInstance.get(
    `/api/v1/unique-tournament/${id}/seasons`
  );

  return data.seasons ?? [];
};

const getLeagueFeaturedEventsByTournament = async (id) => {
  const { data } = await axiosInstance.get(
    `/api/v1/unique-tournament/${id}/featured-events`
  );

  return data.featuredEvents ?? [];
};

const getMediaByTournament = async (id) => {
  const { data } = await axiosInstance.get(
    `/api/v1/unique-tournament/${id}/media`
  );

  return data.media ?? [];
};

const getSeasonInfoByTournament = async (id, seasonId) => {
  const { data } = await axiosInstance.get(
    `/api/v1/unique-tournament/${id}/season/${seasonId}/info`
  );

  return data.info ?? [];
};

const getSeasonStandingByTournament = async (id, seasonId, type) => {
  const { data } = await axiosInstance.get(
    `/api/v1/unique-tournament/${id}/season/${seasonId}/standings/${type}`
  );

  return data.standings ?? [];
};

const getSeasonTopPlayersByTournament = async (
  id,
  seasonId,
  positionDetailed
) => {
  const { data } = await axiosInstance.get(
    `/api/v1/unique-tournament/${id}/season/${seasonId}/top-players/${positionDetailed}`
  );

  return data.topPlayers ?? [];
};

const getSeasonMatchesByTournament = async (id, seasonId, span, page) => {
  const { data } = await axiosInstance.get(
    `/api/v1/unique-tournament/${id}/season/${seasonId}/events/${span}/${page}`
  );

  return data ?? [];
};

/**
 * Get player images
 */
const getTopPlayersImage = async (playerId) => {
  const { data } = await axiosInstance.get(`/api/v1/player/${playerId}/image`);

  return data ?? [];
};

/**
 * Get tournament images
 */
const getTournamentImage = async (id) => {
  const { data } = await axiosInstance.get(
    `/api/v1/unique-tournament/${id}/image`
  );

  return data ?? [];
};

/**
 * Get team images
 */
const getTeamImages = async (teamId) => {
  const { data } = await axiosInstance.get(`/api/v1/team/${teamId}/image`);

  return data ?? [];
};

export default {
  getTournamentById,
  getSeasonsByTournament,
  getLeagueFeaturedEventsByTournament,
  getMediaByTournament,
  getSeasonInfoByTournament,
  getSeasonStandingByTournament,
  getSeasonTopPlayersByTournament,
  getSeasonMatchesByTournament,
  getTopPlayersImage,
  getTournamentImage,
  getTeamImages,
};
