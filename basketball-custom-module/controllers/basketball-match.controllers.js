import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import CustomBasketballMatch from "../models/basketball-match.models.js";
import CustomBasketballTeam from "../models/basketball-team.models.js";
import CustomBasketballPlayers from "../models/basketball-player.models.js";
import mongoose from "mongoose";
import enums from "../../config/enum.js";
import { validateObjectIds, validateEntitiesExistence } from "../../cricket-custom-module/utils/utils.js";
import CustomBasketballTournament from "../models/basketball-tournament.models.js";

const createBasketballMatch = async (req, res) => {
  try {
    const {
      homeTeamId,
      awayTeamId,
      tournamentId,
      period,
      eachLasting,
      location,
      gameContractor,
      dateTime,
      homeTeamPlayers,
      awayTeamPlayers,

    } = req.body;
    const userId = req.user._id;

    // Validate Object IDs
    const validation = validateObjectIds({
      homeTeamId,
      awayTeamId,
      ...(tournamentId && { tournamentId }),
    });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Validate tournament existence
    if(tournamentId){
        const tournament = await CustomBasketballTournament.findById(tournamentId);
        if (!tournament) {
          return apiResponse({
            res,
            status: true,
            message: "Tournament not found",
            statusCode: StatusCodes.NOT_FOUND,
          });
        }
    }

    // Validate maximum 5 players with isPlaying true for each team
    const homePlayingPlayers = homeTeamPlayers.filter(
      (player) => player.isPlaying
    );
    const awayPlayingPlayers = awayTeamPlayers.filter(
      (player) => player.isPlaying
    );
    if (homePlayingPlayers.length > 5 || awayPlayingPlayers.length > 5) {
      return apiResponse({
        res,
        status: false,
        message: "Each team can have a maximum of 5 playing players",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Check for duplicate players
    const allPlayers = [...homeTeamPlayers, ...awayTeamPlayers];
    const playerIds = allPlayers.map(player => player.playerId);
    const uniquePlayerIds = new Set(playerIds);
    if (uniquePlayerIds.size !== playerIds.length) {
      return apiResponse({
        res,
        status: false,
        message: "Duplicate players found in the teams",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Validate teams and players existence
    const entitiesToValidate = [
      { model: CustomBasketballTeam, id: homeTeamId, name: "Home Team" },
      { model: CustomBasketballTeam, id: awayTeamId, name: "Away Team" },
      ...homeTeamPlayers.map((player) => ({
        model: CustomBasketballPlayers,
        id: player.playerId,
        name: "Home Team Player",
      })),
      ...awayTeamPlayers.map((player) => ({
        model: CustomBasketballPlayers,
        id: player.playerId,
        name: "Away Team Player",
      })),
    ];

    for (const entity of entitiesToValidate) {
        if (!mongoose.Types.ObjectId.isValid(entity.id)) {
            return apiResponse({
            res,
            status: false,
            message: `${entity.name} ID is not a valid ObjectId`,
            statusCode: StatusCodes.BAD_REQUEST,
            });
        }
    }
  
    const validationErrors = await validateEntitiesExistence(entitiesToValidate);
        if (validationErrors.length > 0) {
        return apiResponse({
            res,
            status: true,
            message: validationErrors.join(", "),
            statusCode: StatusCodes.NOT_FOUND,
        });
    }

    // Create match
    const match = new CustomBasketballMatch({
      homeTeamId,
      awayTeamId,
      tournamentId: tournamentId || null,
      period,
      eachLasting,
      location,
      gameContractor,
      dateTime,
      homeTeamPlayers,
      awayTeamPlayers,
      status: enums.matchStatusEnum.not_started,
      createdBy: userId,
    });

    await match.save();

    return apiResponse({
      res,
      status: true,
      message: "Match created successfully",
      statusCode: StatusCodes.CREATED,
      data: match,
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const updateBasketballMatch = async (req, res) => {
    try {   
      const { id: matchId } = req.params;
      
      const {
        homeTeamId,
        awayTeamId,
        period,
        eachLasting,
        location,
        gameContractor,
        dateTime,
        homeTeamPlayers,
        awayTeamPlayers,
      } = req.body;
      const userId = req.user._id;
  
      // Find match
      const match = await CustomBasketballMatch.findById({_id: matchId});
      if (!match) {
        return apiResponse({
          res,
          status: true,
          message: "Match not found",
          statusCode: StatusCodes.NOT_FOUND,
        });
      }
  
      if (match.createdBy.toString() !== userId.toString()) {
        return apiResponse({
          res,
          status: false,
          message: "You are not authorized to update this match",
          statusCode: StatusCodes.FORBIDDEN,
        });
      }
  
      // Validate Object IDs
      const validation = validateObjectIds({
        matchId,
        homeTeamId,
        awayTeamId,
      });
      if (!validation.isValid) {
        return apiResponse({
          res,
          status: false,
          message: validation.message,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
  
      // Validate period
      if (period < 1 || period > 4) {
        return apiResponse({
          res,
          status: false,
          message: "Period must be between 1 and 4",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
  
      // Validate each lasting
      if (![10, 12].includes(eachLasting)) {
        return apiResponse({
          res,
          status: false,
          message: "Each lasting must be either 10 or 12 minutes",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
  
      // Validate minimum 5 players and maximum 15 players for each team
      if (
        !Array.isArray(homeTeamPlayers) ||
        homeTeamPlayers.length < 5 ||
        homeTeamPlayers.length > 15 ||
        !Array.isArray(awayTeamPlayers) ||
        awayTeamPlayers.length < 5 ||
        awayTeamPlayers.length > 15
      ) {
        return apiResponse({
          res,
          status: false,
          message: "Each team must have between 5 and 15 players",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
  
      // Validate maximum 5 players with isPlaying true for each team
      const homePlayingPlayers = homeTeamPlayers.filter(
        (player) => player.isPlaying
      );
      const awayPlayingPlayers = awayTeamPlayers.filter(
        (player) => player.isPlaying
      );
      if (homePlayingPlayers.length > 5 || awayPlayingPlayers.length > 5) {
        return apiResponse({
          res,
          status: false,
          message: "Each team can have a maximum of 5 playing players",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
  
      // Validate teams and players existence
      const entitiesToValidate = [
        { model: CustomBasketballTeam, id: homeTeamId, name: "Home Team" },
        { model: CustomBasketballTeam, id: awayTeamId, name: "Away Team" },
        ...homeTeamPlayers.map((player) => ({
          model: CustomBasketballPlayers,
          id: player.playerId,
          name: "Home Team Player",
        })),
        ...awayTeamPlayers.map((player) => ({
          model: CustomBasketballPlayers,
          id: player.playerId,
          name: "Away Team Player",
        })),
      ];
      const validationErrors = await validateEntitiesExistence(entitiesToValidate);
      if (validationErrors.length > 0) {
        return apiResponse({
          res,
          status: true,
          message: validationErrors.join(", "),
          statusCode: StatusCodes.NOT_FOUND,
        });
      }
  
      // Check for duplicate players
      const allPlayers = [...homeTeamPlayers, ...awayTeamPlayers];
      const playerIds = allPlayers.map(player => player.playerId);
      const uniquePlayerIds = new Set(playerIds);
      if (uniquePlayerIds.size !== playerIds.length) {
        return apiResponse({
          res,
          status: false,
          message: "Duplicate players found in the teams",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
  
      // Update only provided fields
      if (homeTeamId) match.homeTeamId = homeTeamId;
      if (awayTeamId) match.awayTeamId = awayTeamId;
      if (period) match.period = period;
      if (eachLasting) match.eachLasting = eachLasting;
      if (location) match.location = location;
      if (gameContractor) match.gameContractor = gameContractor;
      if (dateTime) match.dateTime = dateTime;
      if (homeTeamPlayers) match.homeTeamPlayers = homeTeamPlayers;
      if (awayTeamPlayers) match.awayTeamPlayers = awayTeamPlayers;
  
      await match.save();
  
      return apiResponse({
        res,
        status: true,
        message: "Match updated successfully",
        statusCode: StatusCodes.OK,
        data: match,
      });
    } catch (err) {
        console.log(err);
      return apiResponse({
        res,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        status: false,
        message: "Internal server error",
      });
    }
};

const deleteBasketballMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    // Validate Object ID
    const validation = validateObjectIds({ matchId });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Delete match
    const match = await CustomBasketballMatch.findByIdAndDelete(matchId);
    if (!match) {
      return apiResponse({
        res,
        status: true,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if (match.createdBy.toString() !== userId.toString()) {
      return apiResponse({
        res,
        status: false,
        message: "You are not authorized to delete this match",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    return apiResponse({
      res,
      status: true,
      message: "Match deleted successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const listBasketballMatches = async (req, res) => {
  try {
    const matches = await CustomBasketballMatch.find().populate([
      { path: "homeTeamId", model: "CustomBasketballTeam", select: "teamName" },
      { path: "awayTeamId", model: "CustomBasketballTeam", select: "teamName" },
    ]);

    return apiResponse({
      res,
      status: true,
      message: "Matches fetched successfully",
      statusCode: StatusCodes.OK,
      data: matches,
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

export default {
  createBasketballMatch,
  updateBasketballMatch,
  deleteBasketballMatch,
  listBasketballMatches,
};