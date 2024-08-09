import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import CustomBasketballPlayers from "../models/basketball-player.models.js";
import CustomBasketballTeam from "../models/basketball-team.models.js";
import { updateFile, uploadSingleFile } from "../../features/aws/service.js";
import { validateObjectIds } from "../../cricket-custom-module/utils/utils.js";
import { CustomBasketballPlayerRole } from "../models/basketball-common.models.js";
import CustomBasketballMatch from "../models/basketball-match.models.js";
import { CustomBasketballBoxScore } from "../models/basketball-boxscore.models.js";

const createBasketballPlayer = async (req, res, next) => {
  const { playerName, jerseyNumber, role, teamId } = req.body;
  const userId = req.user._id;
  const folderName = "custom_player";
  let url = await uploadSingleFile(req, folderName);

  const validation = validateObjectIds({ teamId, role });
  if (!validation.isValid) {
    return apiResponse({
      res,
      status: false,
      message: validation.message,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  const team = await CustomBasketballTeam.findById(teamId);
  const playerRole = await CustomBasketballPlayerRole.findById(role);
  if (!team) {
    return apiResponse({
      res,
      status: true,
      message: "Team not found",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }

  if (!playerRole) {
    return apiResponse({
      res,
      status: true,
      message: "Player role not found",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }

  try {
    const player = await CustomBasketballPlayers.create({
      playerName,
      jerseyNumber,
      role,
      teamId,
      createdBy: userId,
      image: url ? url : "",
    });

    return apiResponse({
      res,
      status: true,
      data: player,
      message: "Player created successfully!",
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

const BasketballPlayersList = async (req, res) => {
  const userId = req.user._id;
  const { teamId } = req.query;

  const validation = validateObjectIds({ teamId });
  if (!validation.isValid) {
    return apiResponse({
      res,
      status: false,
      message: validation.message,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  const findTeam = await CustomBasketballTeam.findById(teamId);
  if (!findTeam) {
    return apiResponse({
      res,
      status: true,
      message: "Team not found",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }

  try {
    const players = await CustomBasketballPlayers.find({
      teamId,
      createdBy: userId,
    }).populate({
      path: "role",
      model: "CustomBasketballPlayerRole",
      select: "role",
    })
    
    return apiResponse({
      res,
      status: true,
      data: players,
      message: "Players fetched successfully!",
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

const updateBasketballPlayer = async (req, res, next) => {
  const { id: playerId } = req.params;
  const { playerName, jerseyNumber, role, teamId } = req.body;
  const userId = req.user._id;

  if (role) {
    const validation = validateObjectIds({ role });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const playerRole = await CustomBasketballPlayerRole.findById(role);
    if (!playerRole) {
      return apiResponse({
        res,
        status: true,
        message: "Player role not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
  }

  if (teamId) {
    const validation = validateObjectIds({ teamId });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const team = await CustomBasketballTeam.findById(teamId);
    if (!team) {
      return apiResponse({
        res,
        status: true,
        message: "Team not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
  }

  try {
    const validation = validateObjectIds({ playerId });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const findDoc = await CustomBasketballPlayers.findById(playerId);
    if (!findDoc) {
      return apiResponse({
        res,
        status: false,
        message: "Player not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Check if the user updating the player is the same as the one who created it
    if (findDoc.createdBy.toString() !== userId.toString()) {
      return apiResponse({
        res,
        status: false,
        message: "You are not authorized to update this player",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    const updateData = {};
    if (playerName !== undefined) updateData.playerName = playerName;
    if (jerseyNumber !== undefined) updateData.jerseyNumber = jerseyNumber;
    if (role !== undefined) updateData.role = role;
    if (teamId !== undefined) updateData.teamId = teamId;

    // Handle image update
    if (req.file && req.file.originalname) {
      const folderName = "custom_player";
      const newUrl = await updateFile(req, findDoc, folderName);
      updateData.image = newUrl;
    } else if (req.body.image === "") {
      updateData.image = findDoc.image;
    }

    const updatedPlayer = await CustomBasketballPlayers.findByIdAndUpdate(
      playerId,
      updateData,
      { new: true }
    );

    return apiResponse({
      res,
      status: true,
      data: updatedPlayer,
      message: "Player updated successfully!",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    console.error(err);
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const deleteBasketballPlayer = async (req, res) => {
  const { id: playerId } = req.params;
  const userId = req.user._id;

  const validation = validateObjectIds({ playerId });
  if (!validation.isValid) {
    return apiResponse({
      res,
      status: false,
      message: validation.message,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    const player = await CustomBasketballPlayers.findById(playerId);
    if (!player) {
      return apiResponse({
        res,
        status: true,
        message: "Player not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Check if the user deleting the player is the same as the one who created it
    if (player.createdBy.toString() !== userId.toString()) {
      return apiResponse({
        res,
        status: false,
        message: "You are not authorized to delete this player",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    await CustomBasketballPlayers.findByIdAndDelete(playerId);
    return apiResponse({
      res,
      status: true,
      message: "Player deleted successfully!",
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

const substituteBasketballPlayer = async (req, res) => {
  try {
    const { matchId, substituteOutPlayerId, substituteInPlayerId } = req.body;

    // Validate Object IDs
    const validation = validateObjectIds({ matchId, substituteOutPlayerId, substituteInPlayerId });
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
        status: false,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const boxScore = await CustomBasketballBoxScore.findOne({ matchId });
    const homePlayers = boxScore.boxScore.homeTeam?.players || [];
    const awayPlayers = boxScore.boxScore.awayTeam?.players || [];

    // Check if substituteOutPlayerId is currently playing
    const playerOut = homePlayers.concat(awayPlayers).find(player => player.playerId.toString() === substituteOutPlayerId && player.isPlaying);
    if (!playerOut) {
      return apiResponse({
        res,
        status: false,
        message: "Player to be substituted out is not currently playing",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Check if substituteInPlayerId is a substitute player
    const playerIn = homePlayers.concat(awayPlayers).find(player => player.playerId.toString() === substituteInPlayerId && !player.isPlaying);
    if (!playerIn) {
      return apiResponse({
        res,
        status: false,
        message: "Player to be substituted in is not a substitute player",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Determine the team of the player going out
    let substituteOutPlayerTeamId;
    let substituteInPlayerTeamId;

    if (homePlayers.some(player => player.playerId.toString() === playerOut.playerId.toString())) {
      substituteOutPlayerTeamId = boxScore.boxScore.homeTeam.teamId;
    } else if (awayPlayers.some(player => player.playerId.toString() === playerOut.playerId.toString())) {
      substituteOutPlayerTeamId = boxScore.boxScore.awayTeam.teamId;
    }

    if (homePlayers.some(player => player.playerId.toString() === playerIn.playerId.toString())) {
      substituteInPlayerTeamId = boxScore.boxScore.homeTeam.teamId;
    } else if (awayPlayers.some(player => player.playerId.toString() === playerIn.playerId.toString())) {
      substituteInPlayerTeamId = boxScore.boxScore.awayTeam.teamId;
    }

    // Ensure both players have teamId
    if (substituteOutPlayerTeamId.toString() !== substituteInPlayerTeamId.toString()) {
      return apiResponse({
        res,
        status: false,
        message: "Both players must belong to the same team",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Update the isPlaying status in CustomBasketballBoxScore
    await CustomBasketballBoxScore.updateOne(
      { matchId, "boxScore.homeTeam.players.playerId": substituteOutPlayerId },
      { $set: { "boxScore.homeTeam.players.$.isPlaying": false } }
    );

    await CustomBasketballBoxScore.updateOne(
      { matchId, "boxScore.awayTeam.players.playerId": substituteOutPlayerId },
      { $set: { "boxScore.awayTeam.players.$.isPlaying": false } }
    );

    await CustomBasketballBoxScore.updateOne(
      { matchId, "boxScore.homeTeam.players.playerId": substituteInPlayerId },
      { $set: { "boxScore.homeTeam.players.$.isPlaying": true } }
    );

    await CustomBasketballBoxScore.updateOne(
      { matchId, "boxScore.awayTeam.players.playerId": substituteInPlayerId },
      { $set: { "boxScore.awayTeam.players.$.isPlaying": true } }
    );

    return apiResponse({
      res,
      status: true,
      message: "Player substituted successfully",
      statusCode: StatusCodes.OK,
      data: null,
    });
  } catch (err) {
    console.error(err);
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};


export default {
  createBasketballPlayer,
  BasketballPlayersList,
  updateBasketballPlayer,
  deleteBasketballPlayer,
  substituteBasketballPlayer
};
