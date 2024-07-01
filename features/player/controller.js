import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import PlayerDetails from "./models/playerDetailsSchema.js";

const getPlayerDetailsById = async (req, res, next) => {
  console.log(11);
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
              },
            },
          },
        },
      },
    ]);

    return apiResponse({
      res,
      data: teamPlayerData,
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

      cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "Player matches fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
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
