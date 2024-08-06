import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import { CustomBasketballPlayerRole } from "../models/basketball-common.models.js";

const getBasketballPlayerRoles = async (req, res, next) => {
  try {
    const playerRoles = await CustomBasketballPlayerRole.find();
    return apiResponse({ 
      res, 
      statusCode: StatusCodes.OK, 
      message: "Basketball player roles fetched successfully", 
      status: true, 
      data: playerRoles 
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        status: true,
        message: "Basketball player roles not found",
      });
    } else {
      return apiResponse({ 
        res, 
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR, 
        message: "Internal server error", 
        status: false 
      });
    }
  }
};


export default {
  getBasketballPlayerRoles,
};
