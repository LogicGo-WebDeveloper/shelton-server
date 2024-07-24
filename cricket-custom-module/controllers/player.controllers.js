import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import validate from "../validation/validation.js";
import CustomPlayers from "../models/player.models.js";
import mongoose from "mongoose";
import { updateFile, uploadSingleFile } from "../../features/aws/service.js";

const createPlayer = async (req, res, next) => {
  const { playerName, phoneNumber, role } = req.body;
  const folderName = "custom_player";
  let url = await uploadSingleFile(req, folderName);

  try {
    const player = await CustomPlayers.create({
      playerName,
      phoneNumber,
      role,
      image: url,
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
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return apiResponse({
      res,
      status: false,
      message: "Invalid player ID",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  const findDoc = await CustomPlayers.findById(id);
  if (!findDoc) {
    return apiResponse({
      res,
      status: false,
      message: "Player not found",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }
  const folderName = "custom_player";
  const { playerName, phoneNumber, role } = req.body;
  let newUrl = await updateFile(req, findDoc, folderName);

  try {
    const player = await CustomPlayers.findByIdAndUpdate(
      id,
      { playerName, phoneNumber, role, image: newUrl },
      { new: true }
    );

    return apiResponse({
      res,
      status: true,
      data: player,
      message: "Player updated successfully!",
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

const deletePlayer = async (req, res, next) => {
  const id = req.params.id;
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return apiResponse({
      res,
      status: false,
      message: "Invalid player ID",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    const player = await CustomPlayers.findById(id);
    if (player) {
      await CustomPlayers.findByIdAndDelete(id);
      return apiResponse({
        res,
        status: true,
        message: "Player deleted successfully!",
        statusCode: StatusCodes.OK,
      });
    } else {
      return apiResponse({
        res,
        status: false,
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
