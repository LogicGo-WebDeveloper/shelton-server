import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import CustomTeam from "../models/team.models.js";
import { validateObjectIds } from "../utils/utils.js";
import { updateFile, uploadSingleFile } from "../../features/aws/service.js";
import { CustomCityList } from "../models/common.models.js";
import CustomTournament from "../models/tournament.models.js";

const createTeam = async (req, res, next) => {
  try {
    const folderName = "custom_team";
    const { teamName, city, tournamentId } = req.body;
    const userId = req.user._id;
    let url = await uploadSingleFile(req, folderName);

    const validation = validateObjectIds({ tournamentId, city });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const tournament = await CustomTournament.findById(tournamentId);
    const isCity = await CustomCityList.findById(city);

    if (!tournament) {
      return apiResponse({
        res,
        status: true,
        message: "Tournament not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    if (!isCity) {
      return apiResponse({
        res,
        status: true,
        message: "City not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const result = await CustomTeam.create({
      teamName,
      city,
      teamImage: url ? url : "",
      createdBy: userId,
      tournamentId,
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
  const userId = req.user._id;
  const { tournamentId } = req.query;

  const validation = validateObjectIds({ tournamentId });
  if (!validation.isValid) {
    return apiResponse({
      res,
      status: false,
      message: validation.message,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  const findTournament = await CustomTournament.findById(tournamentId);
  if (!findTournament) {
    return apiResponse({
      res,
      status: true,
      message: "Tournament not found",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }

  try {
    const teams = await CustomTeam.find({
      tournamentId,
      createdBy: userId,
    }).populate({
      path: "city",
      model: "CustomCityList",
      select: "city",
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
  const { teamName, city, tournamentId } = req.body;

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
  }

  if (tournamentId) {
    const validation = validateObjectIds({ tournamentId });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const findTournament = await CustomTournament.findById(tournamentId);
    if (!findTournament) {
      return apiResponse({
        res,
        status: true,
        message: "Tournament not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
  }

  if (city) {
    const validation = validateObjectIds({ city });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const findCity = await CustomCityList.findById(city);
    if (!findCity) {
      return apiResponse({
        res,
        status: true,
        message: "City not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
  }

  const folderName = "custom_team";
  const team = await CustomTeam.findById(teamId);
  let newUrl = await updateFile(req, team, folderName);
  if (team) {
    await CustomTeam.findByIdAndUpdate(
      teamId,
      {
        teamName,
        city,
        teamImage: newUrl,
        createdBy: team.createdBy,
        tournamentId,
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
      status: true,
      message: "Team not found",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }
};

const deleteTeam = async (req, res) => {
  const { id: teamId } = req.params;
  const userId = req.user._id;

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
    if (!team) {
      return apiResponse({
        res,
        status: false,
        message: "Team not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if (team.createdBy.toString() !== userId.toString()) {
      return apiResponse({
        res,
        status: false,
        message: "You are not authorized to delete this team",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    await CustomTeam.findByIdAndDelete(teamId);
    return apiResponse({
      res,
      status: true,
      message: "Team deleted successfully!",
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
  createTeam,
  listTeams,
  updateTeam,
  deleteTeam,
};
