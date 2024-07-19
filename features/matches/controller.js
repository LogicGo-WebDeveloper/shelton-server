import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import MatcheDetailsByMatchScreen from "./models/matchDetailsSchema.js";
import {
  filterLiveMatchData,
  fractionalOddsToDecimal,
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
import MatchH2H from "./models/matchH2HSchema.js";
import MatchesScreenMatches from "./models/matchesDetails.js";
import helper from "../../helper/common.js";
import config from "../../config/config.js";
import { uploadFile } from "../../helper/aws_s3.js";

const getOverDetailsById = async (req, res, next) => {
  try {
    const { matchId, homeTeamId, awayTeamId } = req.query;
    console.log(req.query);
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
      data: data?.data?.innings,
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

    const scoreCard = await MatchesSquad.findOne({ matchId });

    if (scoreCard) {
      data = scoreCard;
    } else {
      data = await service.getSquad(matchId);

      const processPlayerImages = async (players) => {
        for (const player of players) {
          const playerId = player.player.id;
          try {
            const name = playerId;
            const folderName = "player";
            const baseUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`;

            // Check if the image URL already exists
            try {
              const response = await fetch(baseUrl);
              if (response.status !== 200) {
                player.player.image = null;
              } else {
                player.player.image = baseUrl;
              }
              // console.log({ playerId }, "==> free");
            } catch (error) {
              const image = await service.getTopPlayersImage(playerId);
              // console.log({ playerId }, "==> paid");
              await uploadFile({
                filename: `${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`,
                file: image,
                ACL: "public-read",
              });
              const imageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`;
              player.player.image = imageUrl;
            }
          } catch (error) {
            console.error(
              `Failed to upload image for player ${playerId}:`,
              error
            );
          }
        }
      };

      const processAllPlayerImages = async (data) => {
        const categories = ["home", "away"];
        for (const category of categories) {
          if (data[category] && data[category].players) {
            await processPlayerImages(data[category].players);
          }
        }
      };

      await processAllPlayerImages(data);

      const squadEntry = new MatchesSquad({
        matchId,
        data,
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
    const authHeader = req.headers?.authorization;
    const token = authHeader ? authHeader?.split(" ")[1] : null;
    let decodedToken;
    if (token) {
      decodedToken = await helper.verifyToken(token);
    } else {
      decodedToken = null;
    }

    const getImageUrl = async (teamId) => {
      const name = teamId;
      const folderName = "team";
      let filename;
      const baseUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`;

      // Check if the image URL already exists
      try {
        const response = await fetch(baseUrl);
        if (response.status === 200) {
          filename = baseUrl;
        } else {
          filename = null;
        }
      } catch (error) {
        const image = await service.getTeamImages(teamId);
        console.log({ teamId }, "==> paid <==");
        await uploadFile({
          filename: `${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`,
          file: image,
          ACL: "public-read",
        });
        filename = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`;
      }

      return filename;
    };

    if (!data) {
      let matchDetails = await MatcheDetailsByMatchScreen.findOne({
        matchId: id,
      });

      if (matchDetails) {
        data = matchDetails;
      } else {
        const apiData = await service.getSingleMatchDetail(id);

        // Fetch image URLs for home and away teams
        const homeTeamImageUrl = await getImageUrl(apiData.event.homeTeam.id);
        const awayTeamImageUrl = await getImageUrl(apiData.event.awayTeam.id);

        // Add image URLs to the team data
        apiData.event.homeTeam.image = homeTeamImageUrl;
        apiData.event.awayTeam.image = awayTeamImageUrl;

        const matchEntry = new MatcheDetailsByMatchScreen({
          matchId: id,
          data: apiData,
        });
        await matchEntry.save();
        data = matchEntry.data;
        cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
      }
    }

    const filteredMatchDetails = filterLiveMatchData(data);
    if (decodedToken?.userId) {
      await helper.storeRecentMatch(
        decodedToken?.userId,
        data?.event?.tournament?.category?.sport?.slug,
        filteredMatchDetails
      );
    }
    return apiResponse({
      res,
      data: filteredMatchDetails,
      status: true,
      message: "match details fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log(error);
    if (error.response.status === 404) {
      return apiResponse({
        res,
        status: true,
        message: "match details not found",
        statusCode: StatusCodes.NOT_FOUND,
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
    if (error.response.status === 404) {
      return apiResponse({
        res,
        status: true,
        message: "match votes not found",
        statusCode: StatusCodes.NOT_FOUND,
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
        const pregameFormEntry = new PregameForm({
          matchId: id,
          data: apiData,
        });
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
    if (error.response.status === 404) {
      return apiResponse({
        res,
        status: true,
        message: "pregame form not found",
        statusCode: StatusCodes.NOT_FOUND,
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
        odds: fractionalOddsToDecimal(choice.fractionalValue).toFixed(2),
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

const getMatchesScreenDetailsById = async (req, res, next) => {
  try {
    const { customId } = req.params;
    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    const getImageUrl = async (teamId) => {
      const name = teamId;
      const folderName = "team";
      let filename;
      const baseUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`;

      // Check if the image URL already exists
      try {
        const response = await fetch(baseUrl);
        if (response.status !== 200) {
          filename = null;
        } else {
          filename = baseUrl;
        }
        // console.log({ teamId }, "==> free");
      } catch (error) {
        const image = await service.getTeamImages(teamId);
        // console.log({ teamId }, "==> paid <==");
        await uploadFile({
          filename: `${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`,
          file: image,
          ACL: "public-read",
        });
        filename = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`;
      }

      return filename;
    };

    if (!data) {
      const matchesData = await MatchesScreenMatches.findOne({
        customId: customId,
      });
      if (matchesData) {
        data = matchesData?.data;
      } else {
        const apiData = await service.getMatches(customId);

        for (const event of apiData.events) {
          event.homeTeam.image = await getImageUrl(event.homeTeam.id);
          event.awayTeam.image = await getImageUrl(event.awayTeam.id);
        }

        const matchesEntry = new MatchesScreenMatches({
          customId,
          data: apiData,
        });
        await matchesEntry.save();
        data = matchesEntry.data;
        cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
      }
    }

    const filteredMatches = data.events.map(filterLiveMatchData);

    return apiResponse({
      res,
      data: filteredMatches,
      status: true,
      message: "matches fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No matches found",
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

const getMatchH2H = async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    if (!data) {
      let matchH2H = await MatchH2H.findOne({ matchId: id });
      if (matchH2H) {
        data = matchH2H.data;
      } else {
        const apiData = await service.getMatchH2H(id);
        const matchH2HEntry = new MatchH2H({ matchId: id, data: apiData });
        await matchH2HEntry.save();
        data = matchH2HEntry.data;
        cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
      }
    }

    return apiResponse({
      res,
      data: data?.teamDuel,
      status: true,
      message: "h2h fetched successfully",
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
  getMatchVotes,
  getScoreCardDetailsById,
  getSquadDetailsById,
  getPregameForm,
  getMatchOdds,
  getStandingsDetailsById,
  getMatchesScreenDetailsById,
  getMatchH2H,
};
