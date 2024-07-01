import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import Tournament from "./models/tournamentSchema.js";
import Season from "./models/seasonsSchema.js";
import TopPlayers from "./models/topPlayesSchema.js";
import FeaturedMatches from "./models/topPlayesSchema.js";
import SeasonStanding from "./models/standingSchema.js";
import LeagueMatches from "./models/leagueMatchesSchema.js";

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
      data: data[0],
      status: true,
      message: "Featured events fetched successfully",
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

const getSeasonStandingByTournament = async (req, res, next) => {
  try {
    const { id, seasonId, type } = req.params;

    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);

    if (!data) {
      const seasonStanding = await SeasonStanding.findOne({ tournamentId: id });
      if (seasonStanding) {
        const season = seasonStanding.seasons.find(
          (season) => season.seasonId === seasonId
        );
        if (season) {
          data = season.data;
        } else {
          data = await service.getSeasonStandingByTournament(
            id,
            seasonId,
            type
          );
          cacheService.setCache(key, data, cacheTTL.TEN_SECONDS);
          seasonStanding.seasons.push({ seasonId, type, data: data });
          await seasonStanding.save();
        }
      } else {
        data = await service.getSeasonStandingByTournament(id, seasonId, type);
        cacheService.setCache(key, data, cacheTTL.TEN_SECONDS);

        const seasonStandingEntry = new SeasonStanding({
          tournamentId: id,
          seasons: [{ seasonId: seasonId, data: data }],
        });
        await seasonStandingEntry.save();
      }
    }

    const seasonStandingData = await SeasonStanding.aggregate([
      { $match: { tournamentId: id, "seasons.seasonId": seasonId } },
      { $unwind: "$seasons" },
      { $match: { "seasons.seasonId": seasonId } },
      {
        $project: {
          name: { $arrayElemAt: ["$seasons.data.tournament.name", 0] },
          id: { $arrayElemAt: ["$seasons.data.tournament.id", 0] },
          rows: {
            $map: {
              input: { $arrayElemAt: ["$seasons.data.rows", 0] },
              as: "rowObj",
              in: {
                position: "$$rowObj.position",
                matches: "$$rowObj.matches",
                draws: "$$rowObj.draws",
                losses: "$$rowObj.losses",
                points: "$$rowObj.points",
                netRunRate: "$$rowObj.netRunRate",
                noResult: "$$rowObj.noResult",
                wins: "$$rowObj.wins",
                id: "$$rowObj.team.id",
                shortName: "$$rowObj.team.shortName",
                teamName: "$$rowObj.team.name",
              },
            },
          },
        },
      },
    ]);

    return apiResponse({
      res,
      data: seasonStandingData,
      status: true,
      message: "Season standing fetched successfully",
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

    const teamPlayerData = await TopPlayers.aggregate([
      { $match: { tournamentId: id } },
      {
        $project: {
          runsScored: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: {
                      $arrayElemAt: ["$seasons.playerStatistics.runsScored", 0],
                    },
                  },
                  0,
                ],
              },
              then: null,
              else: {
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
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },

          battingStrikeRate: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: {
                      $arrayElemAt: [
                        "$seasons.playerStatistics.battingStrikeRate",
                        0,
                      ],
                    },
                  },
                  0,
                ],
              },
              then: null,
              else: {
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
                            battingStrikeRate:
                              "$$run.statistics.battingStrikeRate",
                            player: "$$run.player.name",
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },

          battingAverage: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: {
                      $arrayElemAt: [
                        "$seasons.playerStatistics.battingAverage",
                        0,
                      ],
                    },
                  },
                  0,
                ],
              },
              then: null,
              else: {
                $reduce: {
                  input: {
                    $arrayElemAt: [
                      "$seasons.playerStatistics.battingAverage",
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
                            battingAverage: "$$run.statistics.battingAverage",
                            player: "$$run.player.name",
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },

          fifties: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: {
                      $arrayElemAt: ["$seasons.playerStatistics.fifties", 0],
                    },
                  },
                  0,
                ],
              },
              then: null,
              else: {
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
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },

          hundreds: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: {
                      $arrayElemAt: ["$seasons.playerStatistics.hundreds", 0],
                    },
                  },
                  0,
                ],
              },
              then: null,
              else: {
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
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },

          fours: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: {
                      $arrayElemAt: ["$seasons.playerStatistics.fours", 0],
                    },
                  },
                  0,
                ],
              },
              then: null,
              else: {
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
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },

          sixes: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: {
                      $arrayElemAt: ["$seasons.playerStatistics.sixes", 0],
                    },
                  },
                  0,
                ],
              },
              then: null,
              else: {
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
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },

          nineties: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: {
                      $arrayElemAt: ["$seasons.playerStatistics.nineties", 0],
                    },
                  },
                  0,
                ],
              },
              then: null,
              else: {
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
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },

          bowlingAverage: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: {
                      $arrayElemAt: [
                        "$seasons.playerStatistics.bowlingAverage",
                        0,
                      ],
                    },
                  },
                  0,
                ],
              },
              then: null,
              else: {
                $reduce: {
                  input: {
                    $arrayElemAt: [
                      "$seasons.playerStatistics.bowlingAverage",
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
                            bowlingAverage: "$$run.statistics.bowlingAverage",
                            player: "$$run.player.name",
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },

          fiveWicketsHaul: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: {
                      $arrayElemAt: [
                        "$seasons.playerStatistics.fiveWicketsHaul",
                        0,
                      ],
                    },
                  },
                  0,
                ],
              },
              then: null,
              else: {
                $reduce: {
                  input: {
                    $arrayElemAt: [
                      "$seasons.playerStatistics.fiveWicketsHaul",
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
                            fiveWicketsHaul: "$$run.statistics.fiveWicketsHaul",
                            player: "$$run.player.name",
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          economy: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: {
                      $arrayElemAt: ["$seasons.playerStatistics.economy", 0],
                    },
                  },
                  0,
                ],
              },
              then: null,
              else: {
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
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },

          bowlingStrikeRate: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: {
                      $arrayElemAt: [
                        "$seasons.playerStatistics.bowlingStrikeRate",
                        0,
                      ],
                    },
                  },
                  0,
                ],
              },
              then: null,
              else: {
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
                            bowlingStrikeRate:
                              "$$run.statistics.bowlingStrikeRate",
                            player: "$$run.player.name",
                          },
                        },
                      },
                    ],
                  },
                },
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
      message: "Season top players fetched successfully",
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
};

const getSeasonMatchesByTournament = async (req, res, next) => {
  try {
    const { id, seasonId, span, page } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    const leagueMatchesData = await LeagueMatches.findOne({ tournamentId: id });
    const findMatches = leagueMatchesData?.seasons?.find(
      (season) => season.seasonId === seasonId
    );
    const count = Math.ceil(findMatches?.data?.length / 10);
    const adjustedPage = Math.floor((page - 1) / 3);

    if (!data || page > count) {
      if (leagueMatchesData) {
        if (findMatches) {
          if (page <= count) {
            console.log("9999999999999999999");
            data = findMatches.data;
          } else {
            const newData = await service.getSeasonMatchesByTournament(
              id,
              seasonId,
              span,
              adjustedPage
            );
            // console.log("findMatches", findMatches)
            const existingEvents = findMatches.data.map((event) => event.id);
            const uniqueEvents = newData.events.filter(
              (event) => !existingEvents.includes(event.id)
            );
            findMatches.data.push(...uniqueEvents);
            await leagueMatchesData.save();
            data = findMatches.data;
          }
        } else {
          data = await service.getSeasonMatchesByTournament(
            id,
            seasonId,
            span,
            adjustedPage
          );
          cacheService.setCache(key, data, cacheTTL.TEN_SECONDS);
          leagueMatchesData.seasons.push({ seasonId, data: data.events });
          await leagueMatchesData.save();
        }
      } else {
        const newData = await service.getSeasonMatchesByTournament(
          id,
          seasonId,
          span,
          0
        );
        if (leagueMatchesData) {
          // Filter out duplicate events
          const existingEvents = leagueMatchesData.seasons.map(
            (season) => season.data
          );
          const uniqueEvents = newData.data.filter(
            (event) => !existingEvents.includes(event.id)
          );
          // Push unique events to the existing data
          leagueMatchesData.seasons.push(...uniqueEvents);
          await leagueMatchesData.save();
          data = leagueMatchesData;
        } else {
          // If no existing data, save the new data
          const leagueMatchesEntry = new LeagueMatches({
            tournamentId: id,
            seasons: [{ seasonId: seasonId, data: newData.events }],
          });
          await leagueMatchesEntry.save();
          data = leagueMatchesEntry;
        }
        cacheService.setCache(key, data, cacheTTL.TEN_SECONDS);
      }
    }

    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const aggregatedData = await LeagueMatches.aggregate([
      { $match: { tournamentId: id, "seasons.seasonId": seasonId } },
      { $unwind: "$seasons" },
      { $match: { "seasons.seasonId": seasonId } },
      { $unwind: "$seasons.data" },
      { $skip: skip },
      { $limit: pageSize },
      {
        $project: {
          homeTeam: {
            name: "$seasons.data.homeTeam.name",
            score: "$seasons.data.homeScore.current",
            wickets: "$seasons.data.homeScore.innings.inning1.wickets",
            overs: "$seasons.data.homeScore.innings.inning1.overs",
          },
          awayTeam: {
            name: "$seasons.data.awayTeam.name",
            score: "$seasons.data.awayScore.current",
            wickets: "$seasons.data.awayScore.innings.inning1.wickets",
            overs: "$seasons.data.awayScore.innings.inning1.overs",
          },
          winner: {
            $cond: {
              if: { $eq: ["$seasons.data.winnerCode", 1] },
              then: "$seasons.data.homeTeam.name",
              else: "$seasons.data.awayTeam.name",
            },
          },
          note: "$seasons.data.note",
          endTimestamp: "$seasons.data.endTimestamp",
          startTimestamp: "$seasons.data.startTimestamp",
          id: "$seasons.data.id",
        },
      },
    ]);

    return apiResponse({
      res,
      data: aggregatedData,
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
