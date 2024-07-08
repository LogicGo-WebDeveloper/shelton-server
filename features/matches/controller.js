import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";

const getOverDetailsById = async (req, res, next) => {
    
  const overs = await sportWebsocketService.getOvers(data.matchId);
  const filterHomeTeam = overs.incidents?.filter(
    (incident) => incident.battingTeamId == data.homeTeamId
  );
  const filterAwayTeam = overs.incidents?.filter(
    (incident) => incident.battingTeamId == data.awayTeamId
  );
  const filteredOvers = {
    homeTeam: {
      data: filteredOversData(filterHomeTeam),
      teamId: data.homeTeamId,
    },
    awayTeam: {
      data: filteredOversData(filterAwayTeam),
      teamId: data.awayTeamId,
    },
  };
};

export default {
  getOverDetailsById,
};
