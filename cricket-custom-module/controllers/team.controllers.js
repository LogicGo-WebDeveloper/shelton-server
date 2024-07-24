import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import CustomTeam from "../models/team.models.js";
import { getHostUrl, validateObjectIds } from "../utils/utils.js";
import { updateFile, uploadSingleFile } from "../../features/aws/service.js";
import helper from "../../helper/common.js";

const createTeam = async (req, res, next) => {
  try {
    const folderName = "custom_team";
    const { teamName, city, addMySelfInTeam } = req.body;
    const userId = req.user._id

    let url = await uploadSingleFile(req, folderName);
    const result = await CustomTeam.create({
      teamName,
      city,
      addMySelfInTeam,
      teamImage: url,
      createdBy: userId,
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
  const { id: teamId } = req.params;
  const validation = validateObjectIds({ teamId });
  if (!validation.isValid) {
    return apiResponse({
      res,
      status: false,
      message: validation.message,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }
  const { teamName, city, addMySelfInTeam } = req.body;
  const findTeam = await CustomTeam.findById(teamId);
  if (!findTeam) {
    return apiResponse({
      res,
      status: false,
      message: "Team not found",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }
  const folderName = "custom_team";
  let newUrl = await updateFile(req, findTeam, folderName);
  const team = await CustomTeam.findById(teamId);
  if (team) {
    await CustomTeam.findByIdAndUpdate(
      teamId,
      {
        teamName,
        city,
        addMySelfInTeam,
        teamImage: newUrl,
        createdBy: team.createdBy, 
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
  const { id: teamId } = req.params;
  const validation = validateObjectIds({ teamId });
  if (!validation.isValid) {
    return apiResponse({
      res,
      status: false,
      message: validation.message,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    const team = await CustomTeam.findById(teamId);
    if (team) {
      await CustomTeam.findByIdAndDelete(teamId);
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
