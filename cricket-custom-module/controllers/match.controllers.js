import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import validate from "../validation/validation.js";
import CustomMatch from "../models/match.models.js";
import { validateObjectIds } from "../utils/utils.js";

const createMatch = async (req, res, next) => {
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

  const validation = validateObjectIds({ homeTeamId, awayTeamId, pitchType, ballType, matchOfficial });
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
      const match = await CustomMatch.findByIdAndUpdate(
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
        },
        { new: true }
      );

      if (!match) {
        return apiResponse({
          res,
          status: true,
          message: "Match not found",
          statusCode: StatusCodes.NOT_FOUND,
        });
      } else {
        return apiResponse({
          res,
          status: true,
          data: match,
          message: "Match updated successfully!",
          statusCode: StatusCodes.OK,
        });
      }
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