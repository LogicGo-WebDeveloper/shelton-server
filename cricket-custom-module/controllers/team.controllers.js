import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import validate from "../validation/validation.js";
import CustomTeam from "../models/team.models.js";
import multer from "multer";
import * as path from "path";
import fs from "fs";
import { getHostUrl } from "../utils/utils.js";
import mongoose from "mongoose";
import { updateFile, uploadSingleFile } from "../../features/aws/service.js";

const createTeam = async (req, res, next) => {
  try {
    const folderName = "custom_team";
    const { teamName, city, addMySelfInTeam } = req.body;
    let url = await uploadSingleFile(req, folderName);
    const result = await CustomTeam.create({
      teamName,
      city,
      addMySelfInTeam,
      teamImage: url,
    });

    return apiResponse({
      res,
      status: true,
      data: result,
      message: "Team created successfully!",
      statusCode: StatusCodes.OK,
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

const listTeams = async (req, res) => {
  try {
    const teams = await CustomTeam.find();
    teams.forEach((element) => {
      element.teamImage = element.teamImage
        ? getHostUrl(req, "team") + element.teamImage
        : "";
    });

    return apiResponse({
      res,
      status: true,
      data: teams,
      message: "Teams fetched successfully!",
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

const updateTeam = async (req, res, next) => {
  const { id } = req.params;
  const { teamName, city, addMySelfInTeam } = req.body;
  const findDoc = await CustomTeam.findById(id);
  if (!findDoc) {
    return apiResponse({
      res,
      status: false,
      message: "Team not found",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }
  const folderName = "custom_team";
  let newUrl = await updateFile(req, findDoc, folderName);
  const team = await CustomTeam.findById(id);
  if (team) {
    await CustomTeam.findByIdAndUpdate(
      id,
      {
        teamName,
        city,
        addMySelfInTeam,
        teamImage: newUrl,
      },
      { new: true }
    )
      .then((resp) => {
        return apiResponse({
          res,
          status: true,
          data: resp,
          message: "Team updated successfully!",
          statusCode: StatusCodes.OK,
        });
      })
      .catch((err) => {
        console.log(err);
        return apiResponse({
          res,
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          status: false,
          message: "Internal server error",
        });
      });
  } else {
    return apiResponse({
      res,
      status: false,
      message: "Team not found",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }
};

const deleteTeam = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return apiResponse({
      res,
      status: false,
      message: "Invalid Team ID",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    const team = await CustomTeam.findById(id);
    if (team) {
      await CustomTeam.findByIdAndDelete(id);
      return apiResponse({
        res,
        status: true,
        message: "Team deleted successfully!",
        statusCode: StatusCodes.OK,
      });
    } else {
      return apiResponse({
        res,
        status: false,
        message: "Team not found",
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
  createTeam,
  listTeams,
  updateTeam,
  deleteTeam,
};
