import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import CustomPlayers from "../models/player.models.js";
import { validateObjectIds } from "../utils/utils.js";
import CustomPlayerScoreCard from "../models/playerScorecard.models.js";
import CustomPlayerOvers from "../models/playersOvers.models.js";
import mongoose from "mongoose";

const getPlayerOvers = async (req, res, next) => {
  try {
    const { id } = req.params;

    const filter = {};
    if (id) filter.id = new mongoose.Types.ObjectId(id);

    const result = await CustomPlayerOvers.find(filter);
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

export default {
  getPlayerOvers,
};
