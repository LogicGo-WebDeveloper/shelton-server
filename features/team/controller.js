import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import PlayerTeam from "./models/playerByteamSchema.js";
import TeamDetails from "./models/teamDetailsSchema.js";
import teamMedia from "./models/teamMediaSchema.js";
import TeamMatches from "./models/teamMatchesSchema.js";

const getTeamPerformance = async (req, res, next) => {
  try {
    const { id } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getTeamPerformance(id);

      cacheService.setCache(key, data, cacheTTL.ONE_DAY);
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "Team performance fetched successfully!",
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

const getTopPlayers = async (req, res, next) => {
  try {
    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getTopPlayers(req.params);

      cacheService.setCache(key, data, cacheTTL.ONE_DAY);
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "Top players fetched successfully",
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

const getTeamDetails = async (req, res, next) => {
  try {
    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      // Check if the data exists in the database
      let detailsTeam = await TeamDetails.findOne({ teamId: req.params.id });

      if (!detailsTeam) {
        // Fetch data from the API
        const apiData = await service.getTeamDetails(req.params);

        // Store the fetched data in the database
        const teamDetailsEntry = new TeamDetails({
          teamId: req.params.id,
          data: apiData,
        });
        await teamDetailsEntry.save();
        // Set the data to be used for aggregation
        detailsTeam = teamDetailsEntry;
      } 

      // Aggregate the data
      const aggregatedData = await TeamDetails.aggregate([
        { $match: { teamId: req.params.id } },
        {
          $project: {
            _id: 0,
            teamId: "$teamId",
            team: {
              name: "$data.team.name",
              slug: "$data.team.slug",
              shortName: "$data.team.shortName",
              gender: "$data.team.gender",
              category: {
                name: "$data.team.category.name",
                slug: "$data.team.category.slug",
                id: "$data.team.category.id",
                flag: "$data.team.category.flag",
              },
              tournament: {
                name: "$data.team.tournament.name",
                slug: "$data.team.tournament.slug",
                uniqueTournament: {
                  name: "$data.team.tournament.uniqueTournament.name",
                  slug: "$data.team.tournament.uniqueTournament.slug",
                  primaryColorHex: "$data.team.tournament.uniqueTournament.primaryColorHex",
                  secondaryColorHex: "$data.team.tournament.uniqueTournament.secondaryColorHex",
                  userCount: "$data.team.tournament.uniqueTournament.userCount",
                  id: "$data.team.tournament.uniqueTournament.id",
                  hasPerformanceGraphFeature: "$data.team.tournament.uniqueTournament.hasPerformanceGraphFeature",
                  displayInverseHomeAwayTeams: "$data.team.tournament.uniqueTournament.displayInverseHomeAwayTeams",
                },
                priority: "$data.team.tournament.priority",
                isLive: "$data.team.tournament.isLive",
                id: "$data.team.tournament.id",
              },
              primaryUniqueTournament: {
                name: "$data.team.primaryUniqueTournament.name",
                slug: "$data.team.primaryUniqueTournament.slug",
                userCount: "$data.team.primaryUniqueTournament.userCount",
                hasPerformanceGraphFeature: "$data.team.primaryUniqueTournament.hasPerformanceGraphFeature",
                id: "$data.team.primaryUniqueTournament.id",
                displayInverseHomeAwayTeams: "$data.team.primaryUniqueTournament.displayInverseHomeAwayTeams",
              },
              userCount: "$data.team.userCount",
              manager: {
                name: "$data.team.manager.name",
                slug: "$data.team.manager.slug",
                shortName: "$data.team.manager.shortName",
                id: "$data.team.manager.id",
                country: {
                  alpha2: "$data.team.manager.country.alpha2",
                  alpha3: "$data.team.manager.country.alpha3",
                  name: "$data.team.manager.country.name",
                },
              },
              venue: {
                city: {
                  name: "$data.team.venue.city.name",
                },
                stadium: {
                  name: "$data.team.venue.stadium.name",
                  capacity: "$data.team.venue.stadium.capacity",
                },
                id: "$data.team.venue.id",
                country: {
                  alpha2: "$data.team.venue.country.alpha2",
                  alpha3: "$data.team.venue.country.alpha3",
                  name: "$data.team.venue.country.name",
                },
              },
              nameCode: "$data.team.nameCode",
              class: "$data.team.class",
              disabled: "$data.team.disabled",
              national: "$data.team.national",
              type: "$data.team.type",
              id: "$data.team.id",
              country: {
                alpha2: "$data.team.country.alpha2",
                alpha3: "$data.team.country.alpha3",
                name: "$data.team.country.name",
              },
              fullName: "$data.team.fullName",
            },
          },
        },
      ]);

      data = aggregatedData[0];
      cacheService.setCache(key, data, cacheTTL.ONE_DAY);
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "Team details fetched successfully",
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

const getTeamPLayers = async (req, res, next) => {
  try {
    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getTeamPLayers(req.params);

      const teamPlayerData = await PlayerTeam.findOne({
        teamId: req.params.id,
      });

      if (teamPlayerData) {
        data = teamPlayerData;
      } else {
        // Fetch data from the API
        data = await service.getTeamPLayers(req.params);
        cacheService.setCache(key, data, cacheTTL.ONE_DAY);

        // Store the fetched data in the database
        const teamPlayerEntry = new PlayerTeam({ teamId: req.params.id, data });
        await teamPlayerEntry.save();
      }

      cacheService.setCache(key, data, cacheTTL.ONE_DAY);
    }

    const teamPlayerData = await PlayerTeam.aggregate([
        { $match: { teamId: req.params.id } },
        {
          $project: {
            players: {
              $map: {
                input: "$data.players",
                as: "playerObj",
                in: {
                  name: "$$playerObj.player.name",
                  position: "$$playerObj.player.position",
                  id: "$$playerObj.player.id",
                  country: "$$playerObj.player.country.name"
                }
              }
            },
            foreignPlayers: {
              $map: {
                input: "$data.foreignPlayers",
                as: "playerObj",
                in: {
                  name: "$$playerObj.player.name",
                  position: "$$playerObj.player.position",
                  id: "$$playerObj.player.id",
                  country: "$$playerObj.player.country.name"
                }
              }
            },
            nationalPlayers: {
              $map: {
                input: "$data.nationalPlayers",
                as: "playerObj",
                in: {
                  name: "$$playerObj.player.name",
                  position: "$$playerObj.player.position",
                  id: "$$playerObj.player.id",
                  country: "$$playerObj.player.country.name"
                }
              }
            },
            supportStaff: {
              $map: {
                input: "$data.supportStaff",
                as: "playerObj",
                in: {
                  name: "$$playerObj.name",
                  role: "$$playerObj.role",
                  id: "$$playerObj.id",
                }
              }
            }
          }
        }
    ]);

    const teamPlayerDataObject = teamPlayerData[0];

    return apiResponse({
      res,
      data: teamPlayerDataObject,
      status: true,
      message: "Team player fetched successfully",
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

const getTeamMatchesByTeam = async (req, res, next) => {
  try {
    const { id, span, page } = req.params;
    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    const teamMatchesData = await TeamMatches.findOne({ teamId: id });
    const count = Math.ceil(teamMatchesData?.matches?.length / 10);
    const adjustedPage = Math.floor((page - 1) / 3);

    console.log("adjustedPage", adjustedPage)

    if (!data || page > count) {
      if (teamMatchesData && page <= count) {
        data = teamMatchesData;
      } else {
        const newData = await service.getTeamMatchesByTeam(id, span, adjustedPage);
        if (teamMatchesData) {
          // Filter out duplicate events
          const existingEvents = teamMatchesData.matches.map(event => event.id);
          const uniqueEvents = newData.events.filter(event => !existingEvents.includes(event.id));
          // Push unique events to the existing data
          teamMatchesData.matches.push(...uniqueEvents);
          await teamMatchesData.save();
          data = teamMatchesData;
        } else {
          // If no existing data, save the new data
          const teamMatchesEntry = new TeamMatches({ teamId: id, matches: newData.events });
          await teamMatchesEntry.save();
          data = teamMatchesEntry;
        }
        cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
      }
    }

    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const filterMatches = await TeamMatches.aggregate([
      { $match: { teamId: id } },
      { $unwind: "$matches" },
      { $skip: skip },
      { $limit: pageSize },
      {
        $project: {
          homeTeam: {
            name: "$matches.homeTeam.name",
            score: "$matches.homeScore.current",
            wickets: "$matches.homeScore.innings.inning1.wickets",
            overs: "$matches.homeScore.innings.inning1.overs"
          },
          awayTeam: {
            name: "$matches.awayTeam.name",
            score: "$matches.awayScore.current",
            wickets: "$matches.awayScore.innings.inning1.wickets",
            overs: "$matches.awayScore.innings.inning1.overs"
          },
          winner: {
            $cond: { if: { $eq: ["$matches.winnerCode", 1] }, then: "$matches.homeTeam.name", else: "$matches.awayTeam.name" }
          },
          note: "$matches.note",
          id: "$matches.id"
        }
      }
    ]);

    return apiResponse({
      res,
      data: filterMatches,
      status: true,
      message: "Team matches fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No team matches found",
        statusCode: StatusCodes.OK,
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

const getTeamPlayerStatisticsSeasons = async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getTeamPlayerStatisticsSeasons(id);

      cacheService.setCache(key, data, cacheTTL.ONE_DAY);
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "Team player statistics seasons fetched successfully",
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

const getTeamMedia = async (req, res, next) => {
  try {
    const { id } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getTeamMedia(id);

      const teamPlayerData = await teamMedia.findOne({
        teamId: req.params.id,
      });

      if (teamPlayerData) {
        data = teamPlayerData;
      } else {
        // Fetch data from the API
        data = await service.getTeamMedia(id);
        cacheService.setCache(key, data, cacheTTL.ONE_DAY);

        // Store the fetched data in the database
        const teamMediaEntry = new teamMedia({ teamId: req.params.id, data });
        await teamMediaEntry.save();
      }

      cacheService.setCache(key, data, cacheTTL.ONE_DAY);
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "Team media fetched successfully",
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
  getTeamPerformance,
  getTopPlayers,
  getTeamDetails,
  getTeamPLayers,
  getTeamMatchesByTeam,
  getTeamPlayerStatisticsSeasons,
  getTeamMedia,
};
