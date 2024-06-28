import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import categoryService from "./service.js";
import cacheTTL from "../cache/constants.js";
import LeagueTournamentList from "./models/leagueTournamentListSchema.js";

const getLeagueTournamentList = async (req, res, next) => {
  try {
    const { id } = req.params;

    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    if (!data) {
      // Check if data exists in the database
      const leagueTournamentList = await LeagueTournamentList.findOne({
        categoryId: id,
      });
      if (leagueTournamentList) {
        data = leagueTournamentList.data;
      } else {
        // Fetch data from the API
        data = await categoryService.getLeagueTournamentList(id);
        cacheService.setCache(key, data, cacheTTL.ONE_DAY);

        // Store the fetched data in the database
        const leagueTournamentEntry = new LeagueTournamentList({
          categoryId: id,
          data,
        });
        await leagueTournamentEntry.save();
      }
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "league tournament list fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Internal server error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export default {
  getLeagueTournamentList,
};
