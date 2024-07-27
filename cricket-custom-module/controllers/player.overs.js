import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import { validateObjectIds } from "../utils/utils.js";
import CustomPlayerOvers from "../models/playersOvers.models.js";
import mongoose from "mongoose";

const getPlayerOvers = async (req, res, next) => {
  try {
    const { id } = req.params;

    const filter = {};
    if (id) filter.id = new mongoose.Types.ObjectId(id);

    const result = await CustomPlayerOvers.find(filter).populate({
      path: "playerScoreCardId",
    });
    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Player overs fetched successfully",
      status: true,
      data: result,
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
