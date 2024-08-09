import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import { validateObjectIds } from "../utils/utils.js";
import CustomPlayerOvers from "../models/playersOvers.models.js";
import mongoose from "mongoose";
import { filteredOversData } from "../../websocket/utils.js";
import CustomPlayers from "../models/player.models.js";

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

    const HomeTeamId = new mongoose.Types.ObjectId(homeTeamId);
    const AwayTeamId = new mongoose.Types.ObjectId(awayTeamId);

    // Fetch overs data
    const overs = await CustomPlayerOvers.find({
      matchId: matchId,
      homeTeamId: HomeTeamId,
      awayTeamId: AwayTeamId,
    })
      .populate({
        path: "homeTeamId",
        model: "CustomTeam",
        select: "teamName teamImage",
      })
      .populate({
        path: "awayTeamId",
        model: "CustomTeam",
        select: "teamName teamImage",
      })
      .populate({
        path: "bowlerId",
        model: "CustomPlayers",
        select: "playerName role image",
        populate: {
          path: "role",
          model: "CustomPlayerRole",
          select: "role",
        },
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

    // Ensure incidents data exists
    const incidents = Array.isArray(overs[0]?.data?.incidents)
      ? overs[0].data.incidents
      : [];

    // Fetch player names and update incidents
    const updatedData = await Promise.all(
      incidents.map(async (incident) => {
        if (incident.battingPlayerId) {
          // Find the corresponding player details
          const battingPlayer = await CustomPlayers.findById(
            incident.battingPlayerId
          );
          const bowlingPlayer = await CustomPlayers.findById(incident.bowlerId);
          return {
            ...incident, // directly use incident if it's a plain object
            battingPlayer: {
              PlayerId: battingPlayer ? battingPlayer._id : null,
              playerName: battingPlayer ? battingPlayer.playerName : null,
              image: battingPlayer ? battingPlayer.image : null,
              jerseyNumber: battingPlayer ? battingPlayer.jerseyNumber : null,
            },
            bowlingPlayer: {
              PlayerId: bowlingPlayer ? bowlingPlayer._id : null,
              playerName: bowlingPlayer ? bowlingPlayer.playerName : null,
              image: bowlingPlayer ? bowlingPlayer.image : null,
              jerseyNumber: bowlingPlayer ? bowlingPlayer.jerseyNumber : null,
            },
          };
        } else {
          return {
            ...incident, // directly use incident if it's a plain object
            playerName: null,
          };
        }
      })
    );

    // Filter incidents based on team IDs
    const filterHomeTeam = updatedData.filter(
      (incident) => incident?.battingTeamId?.equals(HomeTeamId) ?? false
    );

    const filterAwayTeam = updatedData.filter(
      (incident) => incident?.battingTeamId?.equals(AwayTeamId) ?? false
    );

    const homeTeamDetails = {
      teamName: overs[0].homeTeamId.teamName,
      teamImage: overs[0].homeTeamId.teamImage,
    };

    const awayTeamDetails = {
      teamName: overs[0].awayTeamId.teamName,
      teamImage: overs[0].awayTeamId.teamImage,
    };

    // Assuming BowlerDetails are the same for both teams; adjust if needed
    const BowlerDetails = {
      playerName: overs[0].bowlerId.playerName,
      role: overs[0].bowlerId.role,
      image: overs[0].bowlerId.image,
    };

    const filteredOvers = {
      homeTeam: {
        BowlerDetails: BowlerDetails,
        TeamDetails: homeTeamDetails,
        data: filterHomeTeam,
      },
      awayTeam: {
        BowlerDetails: BowlerDetails,
        TeamDetails: awayTeamDetails,
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
