import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import { validateObjectIds } from "../utils/utils.js";
import CustomPlayerOvers from "../models/playersOvers.models.js";
import mongoose from "mongoose";

const getPlayerOvers = async (req, res, next) => {
  try {
    const { matchId, teamId } = req.query;

    const overs = await CustomPlayerOvers.find({
      matchId: matchId,
      homeTeamId: teamId,
    });

    // Construct filter for aggregation
    // const matchFilter = {};
    // if (id) matchFilter["$match"] = { _id: new mongoose.Types.ObjectId(id) };

    // const result = await CustomPlayerOvers.aggregate([
    //   // Match filter if ID is provided
    //   matchFilter,

    //   // Group by matchId and teamId
    //   {
    //     $group: {
    //       _id: {
    //         matchId: "$matchId",
    //         teamId: "$teamId", // Assuming you have a teamId field in your schema
    //       },
    //       records: { $push: "$$ROOT" }, // Collect all records for this group
    //     },
    //   },
    //   // Optional: Unwind or add any additional stages if necessary
    //   {
    //     $sort: { "_id.matchId": 1, "_id.teamId": 1 }, // Sort results by matchId and teamId
    //   },
    // ]);

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Player overs fetched and grouped successfully",
      status: true,
      data: overs,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
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
