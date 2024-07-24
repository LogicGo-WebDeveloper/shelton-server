import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import validate from "../validation/validation.js";
import CustomMatch from "../models/match.models.js";
import { validateObjectIds } from "../utils/utils.js";
import helper from "../../helper/common.js";
import CustomTournament from "../models/tournament.models.js";

const createMatch = async (req, res, next) => {
  const {
    homeTeamId,
    awayTeamId,
    tournamentId,
    noOfOvers,
    overPerBowler,
    city,
    ground,
    dateTime,
    pitchType,
    ballType,
    matchOfficial,
  } = req.body;

  const validation = validateObjectIds({ homeTeamId, awayTeamId, tournamentId, pitchType, ballType, matchOfficial });
  if (!validation.isValid) {
    return apiResponse({
      res,
      status: false,
      message: validation.message,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  const authHeader = req.headers?.authorization;
  const token = authHeader ? authHeader?.split(" ")[1] : null;
  const decodedToken = await helper.verifyToken(token);

  const result = validate.createMatch.validate({
    homeTeamId,
    awayTeamId,
    noOfOvers,
    overPerBowler,
    city,
    ground,
    dateTime,
    pitchType,
    ballType,
    tournamentId,
  });
  
  const tournament = await CustomTournament.findById(tournamentId);
  if (!tournament) {
    return apiResponse({
      res,
      status: true,
      message: "Tournament not found",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }

  if (result.error) {
    return apiResponse({
      res,
      status: false,
      message: result.error.details[0].message,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  } else {
    try {
      const match = await CustomMatch.create({
        homeTeamId,
        awayTeamId,
        noOfOvers,
        overPerBowler,
        city,
        ground,
        dateTime,
        pitchType,
        ballType,
        matchOfficial,
        createdBy: decodedToken.userId,
        tournamentId,
      });

      return apiResponse({
        res,
        status: true,
        data: match,
        message: "Match created successfully!",
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
  }
};

const listMatches = async (req, res) => {
  try {
    const matches = await CustomMatch.find();
    return apiResponse({
      res,
      status: true,
      data: matches,
      message: "Matches fetched successfully!",
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

const updateMatch = async (req, res, next) => {
  const { id: matchId } = req.params;
  const {
    homeTeamId,
    awayTeamId,
    noOfOvers,
    overPerBowler,
    city,
    ground,
    dateTime,
    pitchType,
    ballType,
    matchOfficial,
  } = req.body;

  const validation = validateObjectIds({ matchId, homeTeamId, awayTeamId, pitchType, ballType, matchOfficial });
  if (!validation.isValid) {
    return apiResponse({
      res,
      status: false,
      message: validation.message,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  const result = validate.createMatch.validate({
    homeTeamId,
    awayTeamId,
    noOfOvers,
    overPerBowler,
    city,
    ground,
    dateTime,
    pitchType,
    ballType,
  });

  if (result.error) {
    return apiResponse({
      res,
      status: false,
      message: result.error.details[0].message,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  } else {
    try {
      const match = await CustomMatch.findById(matchId);
      if (!match) {
        return apiResponse({
          res,
          status: false,
          message: "Match not found",
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      const updatedMatch = await CustomMatch.findByIdAndUpdate(
        matchId,
        {
          homeTeamId,
          awayTeamId,
          noOfOvers,
          overPerBowler,
          city,
          ground,
          dateTime,
          pitchType,
          ballType,
          matchOfficial,
          createdBy: match.createdBy,
        },
        { new: true }
      );

      return apiResponse({
        res,
        status: true,
        data: updatedMatch,
        message: "Match updated successfully!",
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

const deleteMatch = async (req, res) => {
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
  try {
    const match = await CustomMatch.findById(matchId);
    if (match) {
      await CustomMatch.findByIdAndDelete(matchId);
      return apiResponse({
        res,
        status: true,
        message: "Match deleted successfully!",
        statusCode: StatusCodes.OK,
      });
    } else {
      return apiResponse({
        res,
        status: false,
        message: "Match not found",
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
  createMatch,
  listMatches,
  updateMatch,
  deleteMatch,
};