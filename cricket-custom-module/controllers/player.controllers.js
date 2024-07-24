import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import validate from "../validation/validation.js";
import CustomPlayers from "../models/player.models.js";
import helper from "../../helper/common.js";
import { validateObjectIds } from "../utils/utils.js";
import CustomTeam from "../models/team.models.js";
import { CustomPlayerRole } from "../models/common.models.js";

const createPlayer = async (req, res, next) => {
  const { playerName, jerseyNumber, role, teamId } = req.body;

  const validation = validateObjectIds({ teamId, role });
  if (!validation.isValid) {
    return apiResponse({
      res,
      status: false,
      message: validation.message,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }
  const result = validate.createPlayer.validate({ playerName, jerseyNumber, role, teamId });
  const authHeader = req.headers?.authorization;
  const token = authHeader ? authHeader?.split(" ")[1] : null;
  const decodedToken = await helper.verifyToken(token);

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

  if (result.error) {
    return res.status(400).json({
      msg: result.error.details[0].message,
    });
  } else {
    try {
      const player = await CustomPlayers.create({ playerName, jerseyNumber, role, teamId, createdBy: decodedToken.userId });
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
  }
};

const listPlayers = async (req, res) => {
  try {
    const players = await CustomPlayers.find();
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

  const validation = validateObjectIds({ playerId, teamId, role });
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

  const result = validate.createPlayer.validate({ playerName, jerseyNumber, role, teamId });

  if (result.error) {
    return res.status(400).json({
      msg: result.error.details[0].message,
    });
  } else {
    const player = await CustomPlayers.findById(playerId);
    const team = await CustomTeam.findById(teamId);
    if (!player) {
      return apiResponse({
        res,
        status: true,
        message: "Player not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if (!team) {
      return apiResponse({
        res,
        status: true,
        message: "Team not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    
    await CustomPlayers.findByIdAndUpdate(
      playerId,
      { playerName, jerseyNumber, role, teamId, createdBy: player.userId },
      { new: true }
    ).then((player) => {
      return apiResponse({
        res,
        status: true,
        data: player,
        message: "Player updated successfully!",
        statusCode: StatusCodes.OK,
      });
    }).catch((err) => {
      return apiResponse({
        res,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        status: false,
        message: "Internal server error",
      });
    });
  }
};

const deletePlayer = async (req, res, next) => {
  const { id: playerId } = req.params;
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
    if (player) {
      await CustomPlayers.findByIdAndDelete(playerId);
      return apiResponse({
        res,
        status: true,
        message: "Player deleted successfully!",
        statusCode: StatusCodes.OK,
      });
    } else {
      return apiResponse({
        res,
        status: true,
        message: "Player not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
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