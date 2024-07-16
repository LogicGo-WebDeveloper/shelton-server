import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import {
  filterLiveMatchData,
  fractionalOddsToDecimal,
  filterStandingsData,
} from "../../websocket/utils.js";
import FavouriteDetails from "./models/favouriteDetails.js";
import FavouritePlayerDetails from "./models/favouritePlayerDetails.js";
import FavouriteTeamDetails from "./models/favouriteTeamDetails.js";

const favouriteMatchesadd = async (req, res, next) => {
  try {
    const matchesId = req.body.matchesId;
    const userId = req.body.userId;
    const existingFavourite = await FavouriteDetails.findOne({
      matchesId: matchesId,
    });

    if (existingFavourite) {
      const updatedFavourite = await FavouriteDetails.updateOne(
        { matchesId: matchesId },
        { userId: userId, status: existingFavourite.status === 1 ? 0 : 1 }
      );

      return apiResponse({
        res,
        status: true,
        message: "Favorite matches remove successfully",
        statusCode: StatusCodes.OK,
      });
    } else {
      // If document does not exist, create a new one
      const newFavourite = await FavouriteDetails.create({
        matchesId: matchesId,
        userId: userId,
        status: 0,
        // Additional fields can be added here
      });
      return apiResponse({
        res,
        data: newFavourite,
        status: true,
        message: "Favorite matches add successfully",
        statusCode: StatusCodes.OK,
      });
    }
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

const favouritePlayersadd = async (req, res, next) => {
  try {
    const playerId = req.body.playerId;
    const userId = req.body.userId;
    const existingFavourite = await FavouritePlayerDetails.findOne({
      playerId: playerId,
    });

    if (existingFavourite) {
      const updatedFavourite = await FavouritePlayerDetails.updateOne(
        { playerId: playerId },
        { userId: userId, status: existingFavourite.status === 1 ? 0 : 1 }
      );

      return apiResponse({
        res,
        status: true,
        message: "Favorite player remove successfully",
        statusCode: StatusCodes.OK,
      });
    } else {
      // If document does not exist, create a new one
      const newFavourite = await FavouritePlayerDetails.create({
        playerId: playerId,
        userId: userId,
        status: 0,
        // Additional fields can be added here
      });
      return apiResponse({
        res,
        data: newFavourite,
        status: true,
        message: "Favorite player add successfully",
        statusCode: StatusCodes.OK,
      });
    }
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

const favouriteTeamsadd = async (req, res, next) => {
  try {
    const teamId = req.body.teamId;
    const userId = req.body.userId;
    const existingFavourite = await FavouriteTeamDetails.findOne({
      teamId: teamId,
    });

    if (existingFavourite) {
      const updatedFavourite = await FavouriteTeamDetails.updateOne(
        { teamId: teamId },
        { userId: userId, status: existingFavourite.status === 1 ? 0 : 1 }
      );

      return apiResponse({
        res,
        status: true,
        message: "Favorite team remove successfully",
        statusCode: StatusCodes.OK,
      });
    } else {
      // If document does not exist, create a new one
      const newFavourite = await FavouriteTeamDetails.create({
        teamId: teamId,
        userId: userId,
        status: 0,
        // Additional fields can be added here
      });
      return apiResponse({
        res,
        data: newFavourite,
        status: true,
        message: "Favorite team add successfully",
        statusCode: StatusCodes.OK,
      });
    }
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

export default {
  favouriteMatchesadd,
  favouritePlayersadd,
  favouriteTeamsadd,
};
