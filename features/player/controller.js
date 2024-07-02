import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import PlayerDetails from "./models/playerDetailsSchema.js";
import PlayerMatches from "./models/playerMatchesSchema.js";

const getPlayerDetailsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getPlayerById(id);
      const players = await PlayerDetails.findOne({ PlayerId: id });

      if (players) {
        data = players.data;
      } else {
        const playerEntry = new PlayerDetails({ PlayerId: id, data });
        await playerEntry.save();
      }

      cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
    }

    const teamPlayerData = await PlayerDetails.aggregate([
      { $match: { PlayerId: id } },
      {
        $project: {
          players: {
            $map: {
              input: "$data.player",
              as: "playerObj",
              in: {
                position: "$$playerObj.position",
                id: "$$playerObj.id",
                country: "$$playerObj.country.name",
                age: "$$playerObj.dateOfBirthTimestamp",
                height: "$$playerObj.height",
                shirtNumber: "$$playerObj.shirtNumber",
                playerQuality: "$$playerObj.cricketPlayerInfo.bowling",
                nationality: "$$playerObj.country.alpha3",
              },
            },
          },
        },
      },
    ]);

    return apiResponse({
      res,
      data: teamPlayerData[0].players[0],
      status: true,
      message: "Player details fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No player found",
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

const getPlayerMatchesById = async (req, res, next) => {
  try {
    const { id, span, page } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getPlayerMatchesById(id, span, page);

      const players = await PlayerMatches.findOne({ playerId: id });
      if (players) {
        data = players.data;
      } else {
        const playerEntry = new PlayerMatches({
          playerId: id,
          matches: data.events,
        });
        await playerEntry.save();
      }

      cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
    }

    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const filterMatches = await PlayerMatches.aggregate([
      { $match: { playerId: id } },
      { $unwind: "$matches" },
      { $skip: skip },
      { $limit: pageSize },

      {
        $project: {
          homeTeam: {
            name: "$matches.homeTeam.name",
            score: "$matches.homeScore.current",
            wickets: "$matches.homeScore.innings.inning1.wickets",
            overs: "$matches.homeScore.innings.inning1.overs",
          },
          awayTeam: {
            name: "$matches.awayTeam.name",
            score: "$matches.awayScore.current",
            wickets: "$matches.awayScore.innings.inning1.wickets",
            overs: "$matches.awayScore.innings.inning1.overs",
          },
          winner: {
            $cond: {
              if: { $eq: ["$matches.winnerCode", 1] },
              then: "$matches.homeTeam.name",
              else: "$matches.awayTeam.name",
            },
          },
          note: "$matches.note",
          id: "$matches.id",
          endTimestamp: "$matches.endTimestamp",
          startTimestamp: "$matches.endTimestamp",
        },
      },
    ]);

    return apiResponse({
      res,
      data: filterMatches,
      status: true,
      message: "Player matches fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No data found",
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
  getPlayerDetailsById,
  getPlayerMatchesById,
};
