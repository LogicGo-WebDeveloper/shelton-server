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
  console.log("data____________", data);

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

export default {
  getTournamentById,
  getSeasonsByTournament,
  getLeagueFeaturedEventsByTournament,
  getMediaByTournament,
  getSeasonInfoByTournament,
  getSeasonStandingByTournament,
  getSeasonTopPlayersByTournament,
  getSeasonMatchesByTournament,
};
