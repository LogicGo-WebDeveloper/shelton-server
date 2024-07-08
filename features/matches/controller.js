import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import { filteredOversData, filterPlayerData } from "../../websocket/utils.js";
import MatchesOvers from "./models/matchesOvers.js";
import MatchesScoreCard from "./models/matchesScoreCard.js";
import MatchesSquad from "./models/matchesSquad.js";

const getOverDetailsById = async (req, res, next) => {
  try {
    const { matchId, homeTeamId, awayTeamId } = req.query;
    let data;

    const teamTopPlayers = await MatchesOvers.findOne({
      matchId: matchId,
      homeTeamId: homeTeamId,
      awayTeamId: awayTeamId,
    });

    if (teamTopPlayers) {
      data = teamTopPlayers;
    } else {
      data = await service.getOvers(matchId);

      const overssEntry = new MatchesOvers({
        matchId: matchId,
        homeTeamId: homeTeamId,
        awayTeamId: awayTeamId,
        data: data,
      });
      await overssEntry.save();
    }

    const filterHomeTeam = data.data.incidents?.filter(
      (incident) => incident.battingTeamId == homeTeamId
    );
    const filterAwayTeam = data.data.incidents?.filter(
      (incident) => incident.battingTeamId == awayTeamId
    );
    const filteredOvers = {
      homeTeam: {
        data: filteredOversData(filterHomeTeam),
        teamId: homeTeamId,
      },
      awayTeam: {
        data: filteredOversData(filterAwayTeam),
        teamId: awayTeamId,
      },
    };

    return apiResponse({
      res,
      data: filteredOvers,
      status: true,
      message: "Overs details fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No overs found",
        statusCode: StatusCodes.OK,
      });
    } else {
      return apiResponse({
        res,
        status: false,
        message: "Internal server error",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
};

const getScoreCardDetailsById = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    let data;

    const scoreCard = await MatchesScoreCard.findOne({
      matchId: matchId,
    });

    if (scoreCard) {
      data = scoreCard;
    } else {
      data = await service.getScorecard(matchId);

      const scoreCardEntry = new MatchesScoreCard({
        matchId: matchId,
        data: data,
      });
      await scoreCardEntry.save();
    }

    return apiResponse({
      res,
      data: data.innings,
      status: true,
      message: "Score Card details fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No scorecard found",
        statusCode: StatusCodes.OK,
      });
    } else {
      return apiResponse({
        res,
        status: false,
        message: "Internal server error",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
};

const getSquadDetailsById = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    let data;

    const scoreCard = await MatchesSquad.findOne({
      matchId: matchId,
    });

    if (scoreCard) {
      data = scoreCard;
    } else {
      data = await service.getSquad(matchId);

      const squadEntry = new MatchesSquad({
        matchId: matchId,
        data: data,
      });
      await squadEntry.save();
    }

    const filteredSquad = {
      home: {
        players: filterPlayerData(data.data.home.players),
        supportStaff: data.data.home.supportStaff,
      },
      away: {
        players: filterPlayerData(data.data.away.players),
        supportStaff: data.data.away.supportStaff,
      },
    };

    return apiResponse({
      res,
      data: filteredSquad,
      status: true,
      message: "Squad details fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No Squad found",
        statusCode: StatusCodes.OK,
      });
    } else {
      return apiResponse({
        res,
        status: false,
        message: "Internal server error",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
};

export default {
  getOverDetailsById,
  getScoreCardDetailsById,
  getSquadDetailsById,
};
