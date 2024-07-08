import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import MatcheDetailsByMatchScreen from "./model/matchDetailsSchema.js";
import { filterLiveMatchData } from "../../websocket/utils.js";
import MatchVotes from "./model/matchVotesSchema.js";

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

const getSingleMatchDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    if (!data) {
      let matchDetails = await MatcheDetailsByMatchScreen.findOne({ matchId: id });

      if (matchDetails) {
        data = matchDetails.data;
      } else {
        const apiData = await service.getSingleMatchDetail(id);
        const matchEntry = new MatcheDetailsByMatchScreen({ matchId: id, data: apiData });
        await matchEntry.save();
        data = matchEntry.data; 
        cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
      }
    }

    const filteredMatchDetails = filterLiveMatchData(data?.event);

    return apiResponse({
      res,
      data: filteredMatchDetails,
      status: true,
      message: "match details fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Internal server error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getMatchVotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    if (!data) {
      let matchDetails = await MatchVotes.findOne({ matchId: id });
      if (matchDetails) {
        data = matchDetails.data;
      } else {
        const apiData = await service.getVotes(id);
        const matchEntry = new MatchVotes({ matchId: id, data: apiData });
        await matchEntry.save();
        data = matchEntry.data; 
        cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
      }
    } 
    return apiResponse({
      res,
      data: data?.vote,
      status: true,
      message: "match votes fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Internal server error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export default {
  getOverDetailsById,
  getSingleMatchDetail,
  getMatchVotes
};
