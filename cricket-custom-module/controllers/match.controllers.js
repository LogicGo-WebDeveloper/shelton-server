import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import validate from "../validation/validation.js";
import CustomMatch from "../models/match.models.js";

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
    return res.status(400).json({
      msg: result.error.details[0].message,
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
  const id = req.params.id;
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
    return res.status(400).json({
      msg: result.error.details[0].message,
    });
  } else {
    try {
      const match = await CustomMatch.findByIdAndUpdate(
        id,
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

      return apiResponse({
        res,
        status: true,
        data: match,
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
  const id = req.params.id;
  try {
    await CustomMatch.findByIdAndDelete(id);
    return apiResponse({
      res,
      status: true,
      message: "Match deleted successfully!",
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
  createMatch,
  listMatches,
  updateMatch,
  deleteMatch,
};