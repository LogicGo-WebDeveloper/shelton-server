import axiosInstance from "../../config/axios.config.js";

const getSeasonStandingsByTeams = async (id, seasonId) => {
  const { data } = await axiosInstance.get(
    `/api/v1/tournament/${id}/season/${seasonId}/standings/total`
  );

  return data ?? [];
};

export default {
  getSeasonStandingsByTeams,
};
