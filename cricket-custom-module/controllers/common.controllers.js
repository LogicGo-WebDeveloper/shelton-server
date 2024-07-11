import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import { CustomCityList, CustomMatchOn, CustomMatchType, CustomTournamentCategory, CustomTournamentWinningPrize } from "../models/common.models.js";

const getCityList = async (req, res, next) => {
  const { page = 1, city } = req.query;
  const limit = 10;
  const query = city ? { city: { $regex: city, $options: "i" } } : {};
  try {
    const cityList = await CustomCityList.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CustomCityList.countDocuments(query);

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Cities fetched successfully",
      status: true,
      data: cityList,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        status: true,
        message: "Cities not found",
      });
    } else {
      return apiResponse({
        res,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        status: false,
        message: "Internal server error",
      });
    }
  }
};

const getTournamentCategory = async (req, res, next) => {
  try {
    const tournamentCategory = await CustomTournamentCategory.find();
    return apiResponse({ 
      res,
      statusCode: StatusCodes.OK,
      message: "Tournament category fetched successfully",
      status: true,
      data: tournamentCategory
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      status: false
    });
  }
};

const getTournamentWinningPrize = async (req, res, next) => {
  try {
    const tournamentWinningPrize = await CustomTournamentWinningPrize.find();
    return apiResponse({ 
      res, 
      statusCode: StatusCodes.OK, 
      message: "Tournament winning prize fetched successfully", 
      status: true, 
      data: tournamentWinningPrize 
    });
  } catch (error) {
    return apiResponse({ 
      res, 
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR, 
      message: "Internal server error", 
      status: false 
    });
  }
};

const getMatchTypes = async (req, res, next) => {
  try {
    const matchTypes = await CustomMatchType.find();
    return apiResponse({ 
      res, 
      statusCode: StatusCodes.OK, 
      message: "Match types fetched successfully", 
      status: true, 
      data: matchTypes 
    });
  } catch (error) {
    return apiResponse({ 
      res, 
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR, 
      message: "Internal server error", 
      status: false 
    });
  }
};

const getMatchOn = async (req, res, next) => {
  try {
    const matchOn = await CustomMatchOn.find();
    return apiResponse({ 
      res, 
      statusCode: StatusCodes.OK, 
      message: "Match on fetched successfully", 
      status: true, 
      data: matchOn 
    });
  } catch (error) {
    return apiResponse({ 
      res, 
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR, 
      message: "Internal server error", 
      status: false 
    });
  }
};

export default {
  getCityList,
  getTournamentCategory,
  getTournamentWinningPrize,
  getMatchTypes,
  getMatchOn
};
