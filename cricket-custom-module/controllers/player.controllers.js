import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import CustomPlayers from "../models/player.models.js";
import { validateObjectIds } from "../utils/utils.js";
import CustomTeam from "../models/team.models.js";
import { CustomPlayerRole } from "../models/common.models.js";
import { updateFile, uploadSingleFile } from "../../features/aws/service.js";

const createPlayer = async (req, res, next) => {
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

  const team = await CustomTeam.findById(teamId);
  const playerRole = await CustomPlayerRole.findById(role);
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
    const player = await CustomPlayers.create({
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
    console.log(err);
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const listPlayers = async (req, res) => {
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

  const findTeam = await CustomTeam.findById(teamId);
  if (!findTeam) {
    return apiResponse({
      res,
      status: true,
      message: "Team not found",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }

  try {
    const players = await CustomPlayers.find({
      teamId,
      createdBy: userId,
    }).populate({
      path: "role",
      model: "CustomPlayerRole",
      select: "role",
    });
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

const updatePlayer = async (req, res, next) => {
  const { id: playerId } = req.params;
  const { playerName, jerseyNumber, role, teamId } = req.body;

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
    const playerRole = await CustomPlayerRole.findById(role);
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
    const team = await CustomTeam.findById(teamId);
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
    if (playerId) {
      const validation = validateObjectIds({ playerId });
      if (!validation.isValid) {
        return apiResponse({
          res,
          status: false,
          message: validation.message,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const findDoc = await CustomPlayers.findById(playerId);
      if (!findDoc) {
        return apiResponse({
          res,
          status: false,
          message: "Player not found",
          statusCode: StatusCodes.NOT_FOUND,
        });
      }
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

    const updatedPlayer = await CustomPlayers.findByIdAndUpdate(
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

const deletePlayer = async (req, res) => {
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
    const player = await CustomPlayers.findById(playerId);

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

    await CustomPlayers.findByIdAndDelete(playerId);
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

export default {
  createPlayer,
  listPlayers,
  updatePlayer,
  deletePlayer,
};
