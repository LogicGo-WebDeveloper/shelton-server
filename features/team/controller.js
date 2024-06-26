import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import PlayerTeam from "./models/playerByteamSchema.js";
import TeamDetails from "./models/teamDetailsSchema.js";
import teamMedia from "./models/teamMediaSchema.js";
import TeamMatches from "./models/teamMatchesSchema.js";
import TeamTopPlayers from "./models/teamTopPlayer.js";
import TeamSeasons from "./models/teamSeasons.js";
import TeamFeaturedMatches from "./models/teamFeaturedMatchesSchema.js";
import TeamSeasonsStanding from "./models/teamSeasonsStandingSchema.js";

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
    let seasonId = req.params.seasonId;
    let tournamentId = req.params.uniqueTournamentId;
    let teamId = req.params.id;
    let type = req.params.type;

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getTopPlayers(req.params);

      const teamTopPlayers = await TeamTopPlayers.findOne({
        teamId: teamId,
        tournamentId: tournamentId,
        seasonId: seasonId,
      });

      if (teamTopPlayers) {
        data = teamTopPlayers.playerStatistics;

        // Fetch data from the API
        data = await service.getTopPlayers(req.params);
        cacheService.setCache(key, data, cacheTTL.ONE_HOUR);

        // Add new season to the existing tournament
      } else {
        // Fetch data from the API
        data = await service.getTopPlayers(req.params);
        cacheService.setCache(key, data, cacheTTL.ONE_HOUR);

        // Create new tournament with the season
        const topPlayersEntry = new TeamTopPlayers({
          teamId: teamId,
          tournamentId: tournamentId,
          seasonId: seasonId,
          type: type,
          seasons: [{ seasonId: seasonId, playerStatistics: data }],
        });
        await topPlayersEntry.save();
      }

      cacheService.setCache(key, data, cacheTTL.ONE_DAY);
    }

    const teamPlayerData = await TeamTopPlayers.aggregate([
      {
        $match: {
          tournamentId: tournamentId,
          teamId: teamId,
          seasonId: seasonId,
          type: type,
        },
      },
      {
        $project: {
          runsScored: {
            $reduce: {
              input: {
                $arrayElemAt: ["$seasons.playerStatistics.runsScored", 0],
              },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this",
                      as: "run",
                      in: {
                        runsScored: "$$run.statistics.runsScored",
                        player: "$$run.player.name",
                        playerId: "$$run.player.id",
                        position: "$$run.player.position",
                      },
                    },
                  },
                ],
              },
            },
          },

          battingStrikeRate: {
            $reduce: {
              input: {
                $arrayElemAt: [
                  "$seasons.playerStatistics.battingStrikeRate",
                  0,
                ],
              },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this",
                      as: "run",
                      in: {
                        battingStrikeRate: "$$run.statistics.battingStrikeRate",
                        player: "$$run.player.name",
                        playerId: "$$run.player.id",
                        position: "$$run.player.position",
                      },
                    },
                  },
                ],
              },
            },
          },

          battingAverage: {
            $reduce: {
              input: {
                $arrayElemAt: ["$seasons.playerStatistics.battingAverage", 0],
              },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this",
                      as: "run",
                      in: {
                        battingAverage: "$$run.statistics.battingAverage",
                        player: "$$run.player.name",
                        playerId: "$$run.player.id",
                        position: "$$run.player.position",
                      },
                    },
                  },
                ],
              },
            },
          },

          fifties: {
            $reduce: {
              input: {
                $arrayElemAt: ["$seasons.playerStatistics.fifties", 0],
              },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this",
                      as: "run",
                      in: {
                        fifties: "$$run.statistics.fifties",
                        player: "$$run.player.name",
                        playerId: "$$run.player.id",
                        position: "$$run.player.position",
                      },
                    },
                  },
                ],
              },
            },
          },

          hundreds: {
            $reduce: {
              input: {
                $arrayElemAt: ["$seasons.playerStatistics.hundreds", 0],
              },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this",
                      as: "run",
                      in: {
                        hundreds: "$$run.statistics.hundreds",
                        player: "$$run.player.name",
                        playerId: "$$run.player.id",
                        position: "$$run.player.position",
                      },
                    },
                  },
                ],
              },
            },
          },

          fours: {
            $reduce: {
              input: {
                $arrayElemAt: ["$seasons.playerStatistics.fours", 0],
              },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this",
                      as: "run",
                      in: {
                        fours: "$$run.statistics.fours",
                        player: "$$run.player.name",
                        playerId: "$$run.player.id",
                        position: "$$run.player.position",
                      },
                    },
                  },
                ],
              },
            },
          },

          sixes: {
            $reduce: {
              input: {
                $arrayElemAt: ["$seasons.playerStatistics.sixes", 0],
              },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this",
                      as: "run",
                      in: {
                        sixes: "$$run.statistics.sixes",
                        player: "$$run.player.name",
                        playerId: "$$run.player.id",
                        position: "$$run.player.position",
                      },
                    },
                  },
                ],
              },
            },
          },

          nineties: {
            $reduce: {
              input: {
                $arrayElemAt: ["$seasons.playerStatistics.nineties", 0],
              },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this",
                      as: "run",
                      in: {
                        nineties: "$$run.statistics.nineties",
                        player: "$$run.player.name",
                        playerId: "$$run.player.id",
                        position: "$$run.player.position",
                      },
                    },
                  },
                ],
              },
            },
          },

          bowlingAverage: {
            $reduce: {
              input: {
                $arrayElemAt: ["$seasons.playerStatistics.bowlingAverage", 0],
              },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this",
                      as: "run",
                      in: {
                        bowlingAverage: "$$run.statistics.bowlingAverage",
                        player: "$$run.player.name",
                        playerId: "$$run.player.id",
                        position: "$$run.player.position",
                      },
                    },
                  },
                ],
              },
            },
          },

          fiveWicketsHaul: {
            $reduce: {
              input: {
                $arrayElemAt: ["$seasons.playerStatistics.fiveWicketsHaul", 0],
              },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this",
                      as: "run",
                      in: {
                        fiveWicketsHaul: "$$run.statistics.fiveWicketsHaul",
                        player: "$$run.player.name",
                        playerId: "$$run.player.id",
                        position: "$$run.player.position",
                      },
                    },
                  },
                ],
              },
            },
          },

          economy: {
            $reduce: {
              input: {
                $arrayElemAt: ["$seasons.playerStatistics.economy", 0],
              },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this",
                      as: "run",
                      in: {
                        economy: "$$run.statistics.economy",
                        player: "$$run.player.name",
                        playerId: "$$run.player.id",
                        position: "$$run.player.position",
                      },
                    },
                  },
                ],
              },
            },
          },

          bowlingStrikeRate: {
            $reduce: {
              input: {
                $arrayElemAt: [
                  "$seasons.playerStatistics.bowlingStrikeRate",
                  0,
                ],
              },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this",
                      as: "run",
                      in: {
                        bowlingStrikeRate: "$$run.statistics.bowlingStrikeRate",
                        player: "$$run.player.name",
                        playerId: "$$run.player.id",
                        position: "$$run.player.position",
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]);

    return apiResponse({
      res,
      data: teamPlayerData[0],
      status: true,
      message: "Top players fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log(error);

    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No data found",
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
              name: { $ifNull: ["$data.team.name", null] },
              slug: { $ifNull: ["$data.team.slug", null] },
              shortName: { $ifNull: ["$data.team.shortName", null] },
              category: {
                name: { $ifNull: ["$data.team.category.name", null] },
                slug: { $ifNull: ["$data.team.category.slug", null] },
                id: { $ifNull: ["$data.team.category.id", null] },
                flag: { $ifNull: ["$data.team.category.flag", null] },
              },
              tournament: {
                name: "$data.team.tournament.name",
                slug: "$data.team.tournament.slug",
                isLive: { $ifNull: ["$data.team.tournament.isLive", null] },
                id: { $ifNull: ["$data.team.tournament.id", null] },
              },
              primaryUniqueTournament: {
                name: {
                  $ifNull: ["$data.team.primaryUniqueTournament.name", null],
                },
                slug: {
                  $ifNull: ["$data.team.primaryUniqueTournament.slug", null],
                },
                id: {
                  $ifNull: ["$data.team.primaryUniqueTournament.id", null],
                },
              },
              manager: {
                name: { $ifNull: ["$data.team.manager.name", null] },
                slug: { $ifNull: ["$data.team.manager.slug", null] },
                shortName: { $ifNull: ["$data.team.manager.shortName", null] },
                id: { $ifNull: ["$data.team.manager.id", null] },
              },
              venue: {
                city: {
                  name: { $ifNull: ["$data.team.venue.city.name", null] },
                },
                stadium: {
                  name: { $ifNull: ["$data.team.venue.stadium.name", null] },
                  capacity: {
                    $ifNull: ["$data.team.venue.stadium.capacity", null],
                  },
                },
                id: { $ifNull: ["$data.team.venue.id", null] },
              },
              nameCode: { $ifNull: ["$data.team.nameCode", null] },
              national: { $ifNull: ["$data.team.national", null] },
              type: { $ifNull: ["$data.team.type", null] },
              id: { $ifNull: ["$data.team.id", null] },
              country: {
                alpha2: { $ifNull: ["$data.team.country.alpha2", null] },
                alpha3: { $ifNull: ["$data.team.country.alpha3", null] },
                name: { $ifNull: ["$data.team.country.name", null] },
              },
              fullName: { $ifNull: ["$data.team.fullName", null] },
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
                country: "$$playerObj.player.country.name",
                dateOfBirthTimestamp: "$$playerObj.player.dateOfBirthTimestamp",
              },
            },
          },
          foreignPlayers: {
            $map: {
              input: "$data.foreignPlayers",
              as: "playerObj",
              in: {
                name: "$$playerObj.player.name",
                position: "$$playerObj.player.position",
                id: "$$playerObj.player.id",
                country: "$$playerObj.player.country.name",
                dateOfBirthTimestamp: "$$playerObj.player.dateOfBirthTimestamp",
              },
            },
          },
          nationalPlayers: {
            $map: {
              input: "$data.nationalPlayers",
              as: "playerObj",
              in: {
                name: "$$playerObj.player.name",
                position: "$$playerObj.player.position",
                id: "$$playerObj.player.id",
                country: "$$playerObj.player.country.name",
                dateOfBirthTimestamp: "$$playerObj.player.dateOfBirthTimestamp",
              },
            },
          },
          supportStaff: {
            $map: {
              input: "$data.supportStaff",
              as: "playerObj",
              in: {
                name: "$$playerObj.name",
                role: "$$playerObj.role",
                id: "$$playerObj.id",
              },
            },
          },
        },
      },
    ]);

    return apiResponse({
      res,
      data: teamPlayerData[0],
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

    if (!data || page > count) {
      if (teamMatchesData && page <= count) {
        data = teamMatchesData;
      } else {
        const newData = await service.getTeamMatchesByTeam(
          id,
          span,
          adjustedPage
        );
        if (teamMatchesData) {
          // Filter out duplicate events
          const existingEvents = teamMatchesData.matches.map(
            (event) => event.id
          );
          const uniqueEvents = newData.events.filter(
            (event) => !existingEvents.includes(event.id)
          );
          // Push unique events to the existing data
          teamMatchesData.matches.push(...uniqueEvents);
          await teamMatchesData.save();
          data = teamMatchesData;
        } else {
          // If no existing data, save the new data
          const teamMatchesEntry = new TeamMatches({
            teamId: id,
            matches: newData.events,
          });
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
            overs: "$matches.homeScore.innings.inning1.overs",
          },
          awayTeam: {
            name: "$matches.awayTeam.name",
            score: "$matches.awayScore.current",
            wickets: "$matches.awayScore.innings.inning1.wickets",
            overs: "$matches.awayScore.innings.inning1.overs",
          },
          winner: {
            $cond: {
              if: { $eq: ["$matches.winnerCode", 1] },
              then: "$matches.homeTeam.name",
              else: "$matches.awayTeam.name",
            },
          },
          note: "$matches.note",
          id: "$matches.id",
          endTimestamp: "$matches.endTimestamp",
          startTimestamp: "$matches.endTimestamp",
        },
      },
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
      const teamMatchesData = await TeamSeasons.findOne({ teamId: id });

      if (teamMatchesData) {
        data = teamMatchesData.seasons;
      } else {
        data = await service.getTeamPlayerStatisticsSeasons(id);

        const teamSeasonEntry = new TeamSeasons({
          teamId: id,
          data: data.uniqueTournamentSeasons,
        });
        await teamSeasonEntry.save();
      }

      cacheService.setCache(key, data, cacheTTL.ONE_DAY);
    }
    const pageSize = 10;
    // const skip = (page - 1) * pageSize;

    const filterMatches = await TeamSeasons.aggregate([
      { $match: { teamId: id } },
      {
        $project: {
          uniqueTournament: {
            $map: {
              input: "$data.uniqueTournament",
              as: "playerObj",
              in: {
                name: "$$playerObj.name",
                slug: "$$playerObj.slug",
                primaryColorHex: "$$playerObj.primaryColorHex",
                id: "$$playerObj.id",
              },
            },
          },
        },
      },
    ]);

    return apiResponse({
      res,
      data: filterMatches[0],
      status: true,
      message: "Team player statistics seasons fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    // console.log(error);
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

const getTeamFeaturedEventsByTeams = async (req, res, next) => {

  try {
    const { id } = req.params;

    const key = cacheService.getCacheKey(req);  

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getTeamFeaturedEventsByTeams(id);

      cacheService.setCache(key, data, cacheTTL.ONE_MINUTE);
      const teamFeaturedData = await TeamFeaturedMatches.findOne({ teamId: id });

      if (teamFeaturedData) {
        data = teamFeaturedData;
      } else {
        // Fetch data from the API
        data = await service.getTeamFeaturedEventsByTeams(id);
        cacheService.setCache(key, data, cacheTTL.ONE_DAY);

        // Store the fetched data in the database
        const teamFeaturedEntry = new TeamFeaturedMatches({ teamId: id, data });
        await teamFeaturedEntry.save();
      }
    }

    const aggregatedData = await TeamFeaturedMatches.aggregate([
      { $match: { teamId: req.params.id } },
      { $unwind: "$data" },
      {
        $project: {
          previousEvent: {
            tournament: {
              name: { $ifNull: ["$data.previousEvent.tournament.name", null] },
              slug: { $ifNull: ["$data.previousEvent.tournament.slug", null] },
              category: {
                name: { $ifNull: ["$data.previousEvent.tournament.category.name", null] },
                slug: { $ifNull: ["$data.previousEvent.tournament.category.slug", null] },
                id: { $ifNull: ["$data.previousEvent.tournament.category.id", null] },
              },
              id: { $ifNull: ["$data.previousEvent.tournament.id", null] },
            },
            homeTeam: {
              name: { $ifNull: ["$data.previousEvent.homeTeam.name", null] },
              slug: { $ifNull: ["$data.previousEvent.homeTeam.slug", null] },
              shortName: { $ifNull: ["$data.previousEvent.homeTeam.shortName", null] },
              nameCode: { $ifNull: ["$data.previousEvent.homeTeam.nameCode", null] },
              id: { $ifNull: ["$data.previousEvent.homeTeam.id", null] },
            },
            awayTeam: {
              name: { $ifNull: ["$data.previousEvent.awayTeam.name", null] },
              slug: { $ifNull: ["$data.previousEvent.awayTeam.slug", null] },
              shortName: { $ifNull: ["$data.previousEvent.awayTeam.shortName", null] },
              nameCode: { $ifNull: ["$data.previousEvent.awayTeam.nameCode", null] },
              id: { $ifNull: ["$data.previousEvent.awayTeam.id", null] },
            },
            status: {
              code: { $ifNull: ["$data.previousEvent.status.code", null] },
              description: { $ifNull: ["$data.previousEvent.status.description", null] },
              type: { $ifNull: ["$data.previousEvent.status.type", null] },
            },
            homeScore: {
              current: { $ifNull: ["$data.previousEvent.homeScore.current", null] },
              display: { $ifNull: ["$data.previousEvent.homeScore.display", null] },
              innings: { $ifNull: ["$data.previousEvent.homeScore.innings", null] },
            },
            awayScore: {
              current: { $ifNull: ["$data.previousEvent.awayScore.current", null] },
              display: { $ifNull: ["$data.previousEvent.awayScore.display", null] },
              innings: { $ifNull: ["$data.previousEvent.awayScore.innings", null] },
            },
            endTimestamp: { $ifNull: ["$data.previousEvent.endTimestamp", null] },
            startTimestamp: { $ifNull: ["$data.previousEvent.startTimestamp", null] },
            note: { $ifNull: ["$data.previousEvent.note", null] },
            slug: { $ifNull: ["$data.previousEvent.slug", null] },
            id: { $ifNull: ["$data.previousEvent.id", null] },
          },
          nextEvent: { 
            tournament: {
              name: { $ifNull: ["$data.nextEvent.tournament.name", null] },
              slug: { $ifNull: ["$data.nextEvent.tournament.slug", null] },
              category: {
                name: { $ifNull: ["$data.nextEvent.tournament.category.name", null] },
                slug: { $ifNull: ["$data.nextEvent.tournament.category.slug", null] },
                id: { $ifNull: ["$data.nextEvent.tournament.category.id", null] },
              },
              id: { $ifNull: ["$data.nextEvent.tournament.id", null] },
            },
            homeTeam: {
              name: { $ifNull: ["$data.nextEvent.homeTeam.name", null] },
              slug: { $ifNull: ["$data.nextEvent.homeTeam.slug", null] },
              shortName: { $ifNull: ["$data.nextEvent.homeTeam.shortName", null] },
              nameCode: { $ifNull: ["$data.nextEvent.homeTeam.nameCode", null] },
              id: { $ifNull: ["$data.nextEvent.homeTeam.id", null] },
            },
            awayTeam: {
              name: { $ifNull: ["$data.nextEvent.awayTeam.name", null] },
              slug: { $ifNull: ["$data.nextEvent.awayTeam.slug", null] },
              shortName: { $ifNull: ["$data.nextEvent.awayTeam.shortName", null] },
              nameCode: { $ifNull: ["$data.nextEvent.awayTeam.nameCode", null] },
              id: { $ifNull: ["$data.nextEvent.awayTeam.id", null] },
            },
            status: {
              code: { $ifNull: ["$data.nextEvent.status.code", null] },
              description: { $ifNull: ["$data.nextEvent.status.description", null] },
              type: { $ifNull: ["$data.nextEvent.status.type", null] },
            },
            homeScore: {
              current: { $ifNull: ["$data.nextEvent.homeScore.current", null] },
              display: { $ifNull: ["$data.nextEvent.homeScore.display", null] },
              innings: { $ifNull: ["$data.nextEvent.homeScore.innings", null] },
            },
            awayScore: {
              current: { $ifNull: ["$data.nextEvent.awayScore.current", null] },
              display: { $ifNull: ["$data.nextEvent.awayScore.display", null] },
              innings: { $ifNull: ["$data.nextEvent.awayScore.innings", null] },
            },
            endTimestamp: { $ifNull: ["$data.nextEvent.endTimestamp", null] },
            startTimestamp: { $ifNull: ["$data.nextEvent.startTimestamp", null] },
            note: { $ifNull: ["$data.nextEvent.note", null] },
            slug: { $ifNull: ["$data.nextEvent.slug", null] },
            id: { $ifNull: ["$data.nextEvent.id", null] },
          },
        },
      },
    ]);

    return apiResponse({
      res,
      data: aggregatedData[0],
      status: true,
      message: "Team featured events fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No data found",
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
}

const getSeasonStandingsbyTeam = async (req, res, next) => {
  try {
    const { id, tournamentId } = req.params;

    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    if (!data) {

      const teamSeasons = await TeamSeasonsStanding.findOne({ teamId: id });
      if(teamSeasons){
        data = teamSeasons.data;
      } else {
        data = await service.getSeasonStandingsbyTeam(id, tournamentId);
        cacheService.setCache(key, data, cacheTTL.ONE_DAY);
         // Store the fetched data in the database
         const teamSeasonsEntry = new TeamSeasonsStanding({ teamId: id, data });
         await teamSeasonsEntry.save();
      }
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: "Team standings seasons fetched successfully",
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
}

export default {
  getTeamPerformance,
  getTopPlayers,
  getTeamDetails,
  getTeamPLayers,
  getTeamMatchesByTeam,
  getTeamPlayerStatisticsSeasons,
  getTeamMedia,
  getTeamFeaturedEventsByTeams,
  getSeasonStandingsbyTeam,
};
