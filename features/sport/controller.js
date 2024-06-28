import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import sportService from "./service.js";
import cacheTTL from "../cache/constants.js";
import SportList from "./models/sportListSchema.js";
import CountryLeagueList from "./models/countryLeagueListSchema.js";

const getCountryLeagueList = async (req, res, next) => {
  try {
    const { sport } = req.params;
    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);
    if (!data) {
      // Check if data exists in the database
      const countryLeagueListEntry = await CountryLeagueList.findOne({ sport });

      if (countryLeagueListEntry) {
        data = countryLeagueListEntry.data;
      } else {
        console.log(22);
        // Fetch data from the API
        data = await sportService.getCountryLeagueList(sport);
        cacheService.setCache(key, data, cacheTTL.ONE_DAY);

        // Store the fetched data in the database
        const newCountryLeagueListEntry = new CountryLeagueList({
          sport,
          data,
        });
        await newCountryLeagueListEntry.save();
      }
    }

    const modifyData = await CountryLeagueList.aggregate([
      { $match: { sport: sport } },
      {
        $project: {
          data: {
            $map: {
              input: "$data",
              as: "dataObj",
              in: {
                name: "$$dataObj.name",
                slug: "$$dataObj.slug",
                id: "$$dataObj.id",
              },
            },
          },
        },
      },
    ]);

    return apiResponse({
      res,
      data: modifyData,
      status: true,
      message: "Tournament leagues fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    if (error.response && error.response.status === 403) {
      return apiResponse({
        res,
        status: false,
        message:
          "Forbidden: You don't have permission to access this resource.",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }
    return apiResponse({
      res,
      status: false,
      message: "Internal server error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getSportList = async (req, res, next) => {
  try {
    const { timezoneOffset } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      // Check if data exists in the database
      const sportListEntry = await SportList.findOne({ timezoneOffset });
      if (sportListEntry) {
        data = sportListEntry.data;
      } else {
        // Fetch data from the API
        data = await sportService.getSportList(timezoneOffset);
        cacheService.setCache(key, data, cacheTTL.TEN_SECONDS);

        // Store the fetched data in the database
        const newSportListEntry = new SportList({ data, timezoneOffset });
        await newSportListEntry.save();
      }
    }

    let formattedData = Object.keys(data).map((key) => {
      return {
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " "),
        live: data[key].live,
        total: data[key].total,
      };
    });

    return apiResponse({
      res,
      data: formattedData,
      status: true,
      message: "Sport list fetched successfully",
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
  getCountryLeagueList,
  getSportList,
};
