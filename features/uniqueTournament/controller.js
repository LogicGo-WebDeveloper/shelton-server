import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import Tournament from "./models/tournamentSchema.js";
import Season from "./models/seasonsSchema.js";
import TopPlayers from "./models/topPlayesSchema.js";
import FeaturedMatches from "./models/topPlayesSchema.js";

const getTournamentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    if (!data) {
      // Check if data exists in the database
      const tournament = await Tournament.findOne({ tournamentId: id });
      if (tournament) {
        data = tournament.data;
      } else {
        // Fetch data from the API
        data = await service.getTournamentById(id);
        cacheService.setCache(key, data, cacheTTL.ONE_DAY);

        // Store the fetched data in the database
        const tournamentEntry = new Tournament({ tournamentId: id, data });
        await tournamentEntry.save();
      }
    }

    const modifyData = await Tournament.aggregate([
      { $match: { tournamentId: id } },
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
      body: modifyData,
      status: true,
      message: "unique tournament fetched successfully",
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

const getSeasonsByTournament = async (req, res, next) => {
  try {
    const { id } = req.params;

    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    if (!data) {
      // Check if data exists in the database
      const season = await Season.findOne({ tournamentId: id });
      if (season) {
        data = season.data;
      } else {
        // Fetch data from the API
        data = await service.getSeasonsByTournament(id);
        cacheService.setCache(key, data, cacheTTL.ONE_DAY);

        // Store the fetched data in the database
        const seasonEntry = new Season({ tournamentId: id, data });
        await seasonEntry.save();
      }
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "Seasons fetched successfully",
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

const getFeaturedEventsByTournament = async (req, res, next) => {
  try {
    const { id } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getFeaturedEventsByTournament(id);

      cacheService.setCache(key, data, cacheTTL.ONE_MINUTE);

      const featuredData = await FeaturedMatches.findOne({ tournamentId: id });

      if (featuredData) {
        data = featuredData;
      } else {
        // Fetch data from the API
        data = await service.getFeaturedEventsByTournament(id);
        cacheService.setCache(key, data, cacheTTL.ONE_DAY);

        // Store the fetched data in the database
        const seasonEntry = new FeaturedMatches({ tournamentId: id, data });
        await seasonEntry.save();
      }
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "Featured events fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    next(error);
    return apiResponse({
      res,
      status: false,
      message: "Internal server error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getMediaByTournament = async (req, res, next) => {
  try {
    const { id } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getMediaByTournament(id);

      cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "Media fetched successfully",
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

const getSeasonInfoByTournament = async (req, res, next) => {
  try {
    const { id, seasonId } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getSeasonInfoByTournament(id, seasonId);

      cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "Season info fetched successfully",
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

const getSeasonStandingByTournament = async (req, res, next) => {
  try {
    const { id, seasonId, type } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getSeasonStandingByTournament(id, seasonId, type);

      cacheService.setCache(key, data, cacheTTL.TEN_SECONDS);
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "Season standing fetched successfully",
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

const getSeasonTopPlayersByTournament = async (req, res, next) => {
  try {
    const { id, seasonId, positionDetailed } = req.params;

    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    if (!data) {
      // Check if data exists in the database
      const topPlayers = await TopPlayers.findOne({ tournamentId: id });
      if (topPlayers) {
        const season = topPlayers.seasons.find(
          (season) => season.seasonId === seasonId
        );
        if (season) {
          data = season.playerStatistics;
        } else {
          // Fetch data from the API
          data = await service.getSeasonTopPlayersByTournament(
            id,
            seasonId,
            positionDetailed
          );
          cacheService.setCache(key, data, cacheTTL.ONE_HOUR);

          // Add new season to the existing tournament
          topPlayers.seasons.push({ seasonId, playerStatistics: data });
          await topPlayers.save();
        }
      } else {
        // Fetch data from the API
        data = await service.getSeasonTopPlayersByTournament(
          id,
          seasonId,
          positionDetailed
        );
        cacheService.setCache(key, data, cacheTTL.ONE_HOUR);

        // Create new tournament with the season
        const topPlayersEntry = new TopPlayers({
          tournamentId: id,
          seasons: [{ seasonId: seasonId, playerStatistics: data }],
        });
        await topPlayersEntry.save();
      }
    }

    const transformedData = data.reduce((acc, item) => {
      Object.keys(item).forEach((key) => {
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(...item[key]);
      });
      return acc;
    }, {});

    return apiResponse({
      res,
      data: transformedData,
      status: true,
      message: "Season top players fetched successfully",
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

const getSeasonMatchesByTournament = async (req, res, next) => {
  try {
    const { id, seasonId, span, page } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getSeasonMatchesByTournament(
        id,
        seasonId,
        span,
        page
      );

      cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "Season matches fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        status: false,
        message: "No matches found",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    } else {
      return apiResponse({
        res,
        status: false,
        message: "Internal server error",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
};

export default {
  getSeasonsByTournament,
  getFeaturedEventsByTournament,
  getMediaByTournament,
  getSeasonInfoByTournament,
  getSeasonStandingByTournament,
  getSeasonTopPlayersByTournament,
  getSeasonMatchesByTournament,
  getTournamentById,
};
