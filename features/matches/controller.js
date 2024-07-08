import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import MatcheDetailsByMatchScreen from "./models/matchDetailsSchema.js";
import { filterLiveMatchData, fractionalOddsToDecimal } from "../../websocket/utils.js";
import {
  filterLiveMatchData,
  filterStandingsData,
} from "../../websocket/utils.js";
import MatchVotes from "./models/matchVotesSchema.js";
import { filteredOversData, filterPlayerData } from "../../websocket/utils.js";
import MatchesOvers from "./models/matchesOvers.js";
import MatchesScoreCard from "./models/matchesScoreCard.js";
import MatchesSquad from "./models/matchesSquad.js";
import PregameForm from "./models/pregameFormSchema.js";
import MatchOdds from "./models/matchOddsSchema.js";
import MatchesStanding from "./models/matchesStandings.js";

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
      data: data,
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

const getSingleMatchDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    if (!data) {
      let matchDetails = await MatcheDetailsByMatchScreen.findOne({
        matchId: id,
      });

      if (matchDetails) {
        data = matchDetails.data;
      } else {
        const apiData = await service.getSingleMatchDetail(id);
        const matchEntry = new MatcheDetailsByMatchScreen({
          matchId: id,
          data: apiData,
        });
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

const getPregameForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    if (!data) {
      let pregameForm = await PregameForm.findOne({ matchId: id });
      if (pregameForm) {
        data = pregameForm.data;
      } else {
        const apiData = await service.getPregameForm(id);
        const pregameFormEntry = new PregameForm({ matchId: id, data: apiData });
        await pregameFormEntry.save();
        data = pregameFormEntry.data;
        cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
      }
    }
    return apiResponse({
      res,
      data: data,
      status: true,
      message: "pregame form fetched successfully",
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

const getMatchOdds = async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    if (!data) {
      let matchOdds = await MatchOdds.findOne({ matchId: id });
      if (matchOdds) {
        data = matchOdds.data;
      } else {
        const apiData = await service.getMatchOdds(id);
        const matchOddsEntry = new MatchOdds({ matchId: id, data: apiData });
        await matchOddsEntry.save();
        data = matchOddsEntry.data;
        cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
      }
    }

    const filteredMatchOdds = data[0].markets.map((market) => ({
      marketName: market.marketName,
      isLive: market.isLive,
      id: market.id,
      choices: market.choices.map((choice) => ({
        name: choice.name,
        odds: fractionalOddsToDecimal(choice.fractionalValue).toFixed(
          2
        ),
      })),
    }));
    return apiResponse({
      res,
      data: filteredMatchOdds,
      status: true,
      message: "match odds fetched successfully",
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

const getStandingsDetailsById = async (req, res, next) => {
  console.log(11);
  try {
    const { tournamentId, seasonId } = req.query;
    console.log(req.query);
    let data;

    const Standings = await MatchesStanding.findOne({
      tournamentId: tournamentId,
      seasonId: seasonId,
    });

    if (Standings) {
      data = Standings;
    } else {
      data = await service.getSeasonStandingsByTeams(tournamentId, seasonId);

      const standingEntry = new MatchesStanding({
        tournamentId: tournamentId,
        seasonId: seasonId,
        data: data,
      });
      await standingEntry.save();
    }

    const filteredStandings = filterStandingsData(data.data.standings[0]);

    return apiResponse({
      res,
      data: filteredStandings,
      status: true,
      message: "Standings details fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No standings found",
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
  getSingleMatchDetail,
  getMatchVotes,
  getScoreCardDetailsById,
  getSquadDetailsById,
  getPregameForm,
  getMatchOdds,
  getStandingsDetailsById,
};