import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import CustomBasketballMatch from "../models/basketball-match.models.js";
import CustomBasketballTeam from "../models/basketball-team.models.js";
import CustomBasketballPlayers from "../models/basketball-player.models.js";
import mongoose from "mongoose";
import helper from "../../helper/common.js";
import { validateObjectIds, validateEntitiesExistence } from "../../cricket-custom-module/utils/utils.js";
import CustomBasketballTournament from "../models/basketball-tournament.models.js";
import { CustomBasketballBoxScore } from "../models/basketball-boxscore.models.js";
import { CustomBasketballPlayerRole } from "../models/basketball-common.models.js";
import enums from "../../config/enum.js";

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
      status,
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
      status,
      createdBy: userId,
    });

    await match.save();

    await createBasketballBoxScore(match);

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
      status
    } = req.body;
    const userId = req.user._id;

    // Validate Object IDs
    const validation = validateObjectIds({
      matchId,
      ...(homeTeamId && { homeTeamId }),
      ...(awayTeamId && { awayTeamId }),
    });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Find match
    const match = await CustomBasketballMatch.findById({ _id: matchId });
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

    // Validate period
    if (period !== undefined && (period < 1 || period > 4)) {
      return apiResponse({
        res,
        status: false,
        message: "Period must be between 1 and 4",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Validate each lasting
    if (eachLasting !== undefined && ![10, 12].includes(eachLasting)) {
      return apiResponse({
        res,
        status: false,
        message: "Each lasting must be either 10 or 12 minutes",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Validate minimum 5 players and maximum 15 players for each team
    if (
      (homeTeamPlayers && (!Array.isArray(homeTeamPlayers) || homeTeamPlayers.length < 5 || homeTeamPlayers.length > 15)) ||
      (awayTeamPlayers && (!Array.isArray(awayTeamPlayers) || awayTeamPlayers.length < 5 || awayTeamPlayers.length > 15))
    ) {
      return apiResponse({
        res,
        status: false,
        message: "Each team must have between 5 and 15 players",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Validate maximum 5 players with isPlaying true for each team
    const homePlayingPlayers = homeTeamPlayers ? homeTeamPlayers.filter((player) => player.isPlaying) : match.homeTeamPlayers.filter((player) => player.isPlaying);
    const awayPlayingPlayers = awayTeamPlayers ? awayTeamPlayers.filter((player) => player.isPlaying) : match.awayTeamPlayers.filter((player) => player.isPlaying);
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
      { model: CustomBasketballTeam, id: homeTeamId || match.homeTeamId, name: "Home Team" },
      { model: CustomBasketballTeam, id: awayTeamId || match.awayTeamId, name: "Away Team" },
      ...(homeTeamPlayers || match.homeTeamPlayers).map((player) => ({
        model: CustomBasketballPlayers,
        id: player.playerId,
        name: "Home Team Player",
      })),
      ...(awayTeamPlayers || match.awayTeamPlayers).map((player) => ({
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
    const allPlayers = [...(homeTeamPlayers || match.homeTeamPlayers), ...(awayTeamPlayers || match.awayTeamPlayers)];
    const playerIds = allPlayers.map((player) => player.playerId);
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
    if (status) match.status = status;

    await match.save();

    return apiResponse({
      res,
      status: true,
      message: "Match updated successfully",
      statusCode: StatusCodes.OK,
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

const deleteBasketballMatch = async (req, res) => {
  try {
    const { id: matchId } = req.params;
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
    const { page = 1, limit = 10, tournamentId, isQuickMatch } = req.query;
    const authHeader = req.headers?.authorization;
    const token = authHeader ? authHeader.split(" ")[1] : null;
    let userId = null;

    if (token) {
      try {
        const decodedToken = await helper.verifyToken(token);
        userId = decodedToken?.userId;
      } catch (error) {
        return apiResponse({
          res,
          statusCode: StatusCodes.UNAUTHORIZED,
          status: false,
          message: "Unauthorized access",
        });
      }
    }

    let condition = {};

    if (userId) {
      condition.createdBy = userId;
    }

    if (tournamentId && isQuickMatch !== "true") {
      condition.tournamentId = tournamentId;
    }

    if (isQuickMatch === "true" && !tournamentId) {
      condition.tournamentId = { $in: [null] };
    }

    const matches = await CustomBasketballMatch.find(condition)
      .populate([
        { path: "homeTeamId", model: "CustomBasketballTeam", select: "teamName teamImage" },
        { path: "awayTeamId", model: "CustomBasketballTeam", select: "teamName teamImage" },
      ])
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalMatches = await CustomBasketballMatch.countDocuments(condition);

    const transformedMatches = matches.map(match => {
      const matchObject = match.toObject();
      return {
        ...matchObject,
        homeTeam: matchObject.homeTeamId,
        awayTeam: matchObject.awayTeamId,
      };
    }).map(({ homeTeamId, awayTeamId, ...rest }) => rest);

    return apiResponse({
      res,
      status: true,
      message: "Matches fetched successfully",
      statusCode: StatusCodes.OK,
      data: {
        matches: transformedMatches,
        totalPages: Math.ceil(totalMatches / limit),
        currentPage: parseInt(page),
      },
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

const basketballDetailMatch = async (req, res) => {
  try {
    const { id: matchId } = req.params;
    
    const validation = validateObjectIds({ matchId });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const match = await CustomBasketballMatch.findById(matchId).populate([
      { path: "homeTeamId", model: "CustomBasketballTeam", select: "teamName teamImage" },
      { path: "awayTeamId", model: "CustomBasketballTeam", select: "teamName teamImage" },
    ]);
    if (!match) {
      return apiResponse({
        res,
        status: true,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const matchDetails = {
      homeTeam: {
        teamName: match.homeTeamId.teamName,
        teamImage: match.homeTeamId.teamImage,
        _id: match.homeTeamId._id,
      },
      awayTeam: {
        teamName: match.awayTeamId.teamName,
        teamImage: match.awayTeamId.teamImage,
        _id: match.awayTeamId._id,
      },
      homeTeamScore: match.homeTeamScore,
      awayTeamScore: match.awayTeamScore,
      status: match.status,
      location: match.location,
    };

    return apiResponse({
      res,
      status: true,
      message: "Match fetched successfully",
      statusCode: StatusCodes.OK,
      data: matchDetails,
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

const createBasketballBoxScore = async (match) => {
  try {
    const homeTeam = await CustomBasketballTeam.findById(match.homeTeamId).select('teamName teamImage');
    const awayTeam = await CustomBasketballTeam.findById(match.awayTeamId).select('teamName teamImage');
    const homePlayers = await CustomBasketballPlayers.find({ _id: { $in: match.homeTeamPlayers.map(p => p.playerId) } }).select('playerName image role jerseyNumber');
    const awayPlayers = await CustomBasketballPlayers.find({ _id: { $in: match.awayTeamPlayers.map(p => p.playerId) } }).select('playerName image role jerseyNumber');
  
    const formatPlayerStats = async (players, teamPlayers) => {
      return Promise.all(players.map(async player => {
        const teamPlayer = teamPlayers.find(p => p.playerId.toString() === player._id.toString());
        const role = await getRoleNameById(player.role);
        return {
          playerId: player._id,
          name: player.playerName,
          image: player.image || "",
          role: role, 
          jerseyNumber: player.jerseyNumber, 
          isPlaying: teamPlayer.isPlaying,
          points: 0,
          rebounds: 0,
          assists: 0,
          fouls: 0,
          turnovers: 0,
          freeThrowsAttempted: 0,
          freeThrowsMade: 0,
        };
      }));
    };

    const homeTeamBoxScore = {
      teamId: homeTeam._id,
      teamName: homeTeam.teamName,
      image: homeTeam.teamImage || defaultImageUrl,
      players: await formatPlayerStats(homePlayers, match.homeTeamPlayers),
    };

    const awayTeamBoxScore = {
      teamId: awayTeam._id,
      teamName: awayTeam.teamName,
      image: awayTeam.teamImage || defaultImageUrl,
      players: await formatPlayerStats(awayPlayers, match.awayTeamPlayers),
    };

    let tournamentName = null;
    if (match.tournamentId) {
      const tournament = await CustomBasketballTournament.findById(match.tournamentId).select('name');
      tournamentName = tournament ? tournament.name : null;
    }

    const boxScore = new CustomBasketballBoxScore({
      matchId: match._id,
      tournamentId: match.tournamentId || null,
      tournamentName: tournamentName || null,
      boxScore: {
        homeTeam: homeTeamBoxScore,
        awayTeam: awayTeamBoxScore,
      }
    });

    await boxScore.save();

  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

// Helper function to get role name by ID
const getRoleNameById = async (roleId) => {
  const role = await CustomBasketballPlayerRole.findById(roleId).select('role');
  console.log("role", role);
  return role ? role.role : '';
};

const getBasketballMatchStatistics = async (req, res) => {
  try {
    const { matchId } = req.params;

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

    // Fetch match data
    const matchBoxScore = await CustomBasketballBoxScore.findOne({ matchId });
    if (!matchBoxScore) {
      return apiResponse({
        res,
        status: true,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Calculate statistics for home team
    const homeTeamStats = matchBoxScore.boxScore.homeTeam.players.reduce(
      (acc, player) => {
        acc.points += player.points;
        acc.rebounds += player.rebounds;
        acc.assists += player.assists;
        acc.fouls += player.fouls;
        acc.freeThrowsAttempted += player.freeThrowsAttempted;
        acc.freeThrowsMade += player.freeThrowsMade;
        return acc;
      },
      { points: 0, rebounds: 0, assists: 0, fouls: 0, freeThrowsAttempted: 0, freeThrowsMade: 0 }
    );

    // Calculate statistics for away team
    const awayTeamStats = matchBoxScore.boxScore.awayTeam.players.reduce(
      (acc, player) => {
        acc.points += player.points;
        acc.rebounds += player.rebounds;
        acc.assists += player.assists;
        acc.fouls += player.fouls;
        acc.freeThrowsAttempted += player.freeThrowsAttempted;
        acc.freeThrowsMade += player.freeThrowsMade;
        return acc;
      },
      { points: 0, rebounds: 0, assists: 0, fouls: 0, freeThrowsAttempted: 0, freeThrowsMade: 0 }
    );

    const formattedMatchStatistics = {
      homeTeam: {
        teamName: matchBoxScore.boxScore.homeTeam.teamName,
        image: matchBoxScore.boxScore.homeTeam.image,
        teamId: matchBoxScore.boxScore.homeTeam.teamId,
        stats: homeTeamStats,
      },
      awayTeam: {
        teamName: matchBoxScore.boxScore.awayTeam.teamName,
        image: matchBoxScore.boxScore.awayTeam.image,
        teamId: matchBoxScore.boxScore.awayTeam.teamId,
        stats: awayTeamStats,
      },
    }

    // Return the statistics
    return apiResponse({
      res,
      status: true,
      message: "Match statistics fetched successfully",
      statusCode: StatusCodes.OK,
      data: formattedMatchStatistics,
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

const updateBasketballMatchResult = async (req, res) => {
  try {
    const { matchId, winnerTeamId, status, reason } = req.body;
    const userId = req.user._id;

    // Validate input
    const validation = validateObjectIds({
      matchId,
      ...(status !== enums.matchStatusEnum.abandoned && { winnerTeamId }),
    });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Find the match
    const match = await CustomBasketballMatch.findById(matchId);
    if (!match) {
      return apiResponse({
        res,
        status: true,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

     // Find the match
     const team = await CustomBasketballTeam.findById(winnerTeamId);
     if (!team) {
       return apiResponse({
         res,
         status: true,
         message: "Team not found",
         statusCode: StatusCodes.NOT_FOUND,
       });
     }

    // Check if the user is the creator of the match
    if (match.createdBy.toString() !== userId.toString()) {
      return apiResponse({
        res,
        status: false,
        message: "You are not authorized to update the result of this match",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    // Fetch team names
    const homeTeam = await CustomBasketballTeam.findById(match.homeTeamId);
    const awayTeam = await CustomBasketballTeam.findById(match.awayTeamId);

    if (!homeTeam || !awayTeam) {
      return apiResponse({
        res,
        status: true,
        message: "One or both teams not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    let matchResultNote = '';
    if (status === enums.matchStatusEnum.finished) {
      if (match.homeTeamScore.current > match.awayTeamScore.current) {
        const margin = match.homeTeamScore.current - match.awayTeamScore.current;
        matchResultNote = `${homeTeam.teamName} won by ${margin} points`;
      } else if (match.awayTeamScore.current > match.homeTeamScore.current) {
        const margin = match.awayTeamScore.current - match.homeTeamScore.current;
        matchResultNote = `${awayTeam.teamName} won by ${margin} points`;
      } else {
        matchResultNote = 'Match is a draw. Home team and away team scored the same points.';
      }
    }

    // Update match result
    if (status === enums.matchStatusEnum.finished) {
      match.status = enums.matchStatusEnum.finished;
      match.matchResultNote = matchResultNote;
    } else {
      if (!reason) {
        return apiResponse({
          res,
          status: false,
          message: "Reason is required for statuses other than 'finished'",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
      if (
        [
          enums.matchStatusEnum.in_progress,
          enums.matchStatusEnum.not_started,
          enums.matchStatusEnum.finished,
        ].includes(status)
      ) {
        return apiResponse({
          res,
          status: false,
          message: "Cannot set status to 'in_progress' or 'not_started'",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
      match.status = status;
      match.matchResultNote = reason;
    }

    await match.save();

    return apiResponse({
      res,
      status: true,
      message: "Match result updated successfully",
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

export default {
  createBasketballMatch,
  updateBasketballMatch,
  deleteBasketballMatch,
  listBasketballMatches,
  basketballDetailMatch,
  getBasketballMatchStatistics,
  updateBasketballMatchResult
};