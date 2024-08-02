import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import { validateObjectIds } from "../utils/utils.js";
import CustomPlayerOvers from "../models/playersOvers.models.js";
import mongoose from "mongoose";
import { filteredOversData } from "../../websocket/utils.js";

const getPlayerOvers = async (req, res, next) => {
  try {
    const { matchId, homeTeamId, awayTeamId } = req.query;

    // Ensure IDs are valid
    if (
      !mongoose.Types.ObjectId.isValid(homeTeamId) ||
      !mongoose.Types.ObjectId.isValid(awayTeamId)
    ) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Invalid team IDs",
        status: false,
      });
    }

    // Fetch overs data
    const overs = await CustomPlayerOvers.find({
      matchId: matchId,
      homeTeamId: homeTeamId,
    });

    // Ensure overs data is present
    if (!overs.length || !overs[0]) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "No overs data found",
        status: false,
      });
    }

    const HomeTeamId = new mongoose.Types.ObjectId(homeTeamId);
    const AwayTeamId = new mongoose.Types.ObjectId(awayTeamId);

    // Ensure incidents data exists
    const incidents = overs[0]?.data?.incidents ?? [];

    // Debugging statements to ensure data is as expected

    // Filter incidents based on team IDs
    const filterHomeTeam = incidents.filter((incident) => {
      return incident?.battingTeamId?.equals(HomeTeamId) ?? false;
    });

    const filterAwayTeam = incidents.filter((incident) => {
      return incident?.battingTeamId?.equals(AwayTeamId) ?? false;
    });

    const filteredOvers = {
      homeTeam: {
        data: filterHomeTeam,
      },
      awayTeam: {
        data: filterAwayTeam,
      },
    };

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Player overs fetched and grouped successfully",
      status: true,
      data: filteredOvers,
    });
  } catch (error) {
    console.error("Error:", error); // Log the error for debugging
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const updatePlayerOvers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { overs, runRate, wicketsTaken, extras, battingTeam, bowlingTeam } =
      req.body;

    if (!validateObjectIds(id)) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        status: false,
        message: "Invalid id provided",
      });
    }

    const playerOvers = await CustomPlayerOvers.findByIdAndUpdate(
      id,
      {
        overs,
        runRate,
        wicketsTaken,
        extras,
        battingTeam,
        bowlingTeam,
      },
      { new: true }
    );

    if (!playerOvers) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        status: false,
        message: "Player overs not found",
      });
    }

    return apiResponse({
      res,
      statusCode: StatusCodes.ACCEPTED,
      status: true,
      message: "Player overs updated successfully",
      data: playerOvers,
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

export default {
  getPlayerOvers,
  updatePlayerOvers,
};
