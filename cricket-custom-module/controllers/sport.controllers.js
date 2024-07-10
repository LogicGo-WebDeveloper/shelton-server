import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import CustomSportList from "../models/sport.models.js";

const getSportList = async (req, res, next) => {
  try {
    const sportList = await CustomSportList.find();

    var fullUrl = req.protocol + '://' + req.get('host') + '/images/';
    sportList.forEach((sport)=>{
      sport.image = sport.image ? fullUrl + sport.image : "";
    })
    
    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Sport list fetched successfully",
      status: true,
      data: sportList,
    });
  } catch (error) {
    if (error.response.status === 404) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        status: true,
        message: "Sport not found",
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

export default {
  getSportList,
};
