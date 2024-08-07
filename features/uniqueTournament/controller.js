import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import Tournament from "./models/tournamentSchema.js";
import Season from "./models/seasonsSchema.js";
import TopPlayers from "./models/topPlayesSchema.js";
import FeaturedMatches from "./models/featuredMachesSchema.js";
import SeasonStanding from "./models/standingSchema.js";
import LeagueMatches from "./models/leagueMatchesSchema.js";
import { uploadFile } from "../../helper/aws_s3.js";
import config from "../../config/config.js";
import helper from "../../helper/common.js";

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
        data = await service.getTournamentById(id);

        const image = await helper.getTournamentImage(data.id);
        let imageUrl;
        const folderName = "tournaments";
        if (image) {
          await helper.uploadImageInS3Bucket(
            `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/unique-tournament/${id}/image`,
            folderName,
            data.id
          );
          imageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${data.id}`;
        } else {
          imageUrl = "";
        }

        let alpha2 = data.category.alpha2 || undefined;
        const flag = data.category.flag || undefined;
        const identifier = (alpha2 || flag).toLowerCase();

        if (identifier) {
          const countryFolderName = "country";
          const image = await helper.getFlagsOfCountry(identifier);
          if (image) {
            await helper.uploadImageInS3Bucket(
              `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/static/images/flags/${identifier}.png`,
              countryFolderName,
              identifier
            );
            data.countryImage = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${countryFolderName}/${identifier}`;
          } else {
            data.countryImage = null;
          }
        }

        data.image = imageUrl;
        cacheService.setCache(key, data, cacheTTL.ONE_DAY);

        // Store the fetched data in the database
        const tournamentEntry = new Tournament({
          tournamentId: id,
          data,
        });
        await tournamentEntry.save();
      }
    }

    const modifyData = await Tournament.aggregate([
      { $match: { tournamentId: id } },
      {
        $lookup: {
          from: "favouriteleaguedetails",
          localField: "_id",
          foreignField: "leagueId",
          as: "favouriteleaguedetails",
        },
      },
      {
        $project: {
          image: 1,
          data: {
            $map: {
              input: "$data",
              as: "dataObj",
              in: {
                favouriteleaguedetails: {
                  $cond: {
                    if: {
                      $gt: [{ $size: "$favouriteleaguedetails" }, 0],
                    },
                    then: {
                      is_favourite: {
                        $arrayElemAt: ["$favouriteleaguedetails.status", 0],
                      },
                    },
                    else: {
                      is_favourite: false,
                    },
                  },
                },
                _id: "$_id",
                name: "$$dataObj.name",
                slug: "$$dataObj.slug",
                id: "$$dataObj.id",
                image: "$$dataObj.image",
                countryImage: "$$dataObj.countryImage",
                titleHolder: "$$dataObj.titleHolder",
                titleHolderTitles: {
                  $ifNull: ["$$dataObj.titleHolderTitles", null],
                },
                mostTitles: { $ifNull: ["$$dataObj.mostTitles", null] },
                mostTitlesTeams: {
                  $ifNull: ["$$dataObj.mostTitlesTeams", null],
                },
                startDateTimestamp: {
                  $ifNull: ["$$dataObj.startDateTimestamp", null],
                },
                endDateTimestamp: {
                  $ifNull: ["$$dataObj.endDateTimestamp", null],
                },
                category: {
                  name: { $ifNull: ["$$dataObj.category.name", null] },
                  slug: { $ifNull: ["$$dataObj.category.slug", null] },
                  flag: { $ifNull: ["$$dataObj.category.flag", null] },
                  id: { $ifNull: ["$$dataObj.category.id", null] },
                  sport: { $ifNull: ["$$dataObj.category.sport", null] },
                  country: { $ifNull: ["$$dataObj.category.country", null] },
                },
              },
            },
          },
        },
      },
    ]);

    return apiResponse({
      res,
      data: modifyData[0]?.data[0],
      status: true,
      message: "unique tournament fetched successfully",
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

const getLeagueFeaturedEventsByTournament = async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    const getImageUrl = async (teamId) => {
      const folderName = "team";
      let imageUrl;
      const image = await helper.getTeamImages(teamId);
      if (image) {
        await helper.uploadImageInS3Bucket(
          `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/team/${teamId}/image`,
          folderName,
          teamId
        );
        imageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${teamId}`;
      } else {
        imageUrl = null;
      }
      return imageUrl;
    };

    if (!data) {
      const featuredMatches = await FeaturedMatches.findOne({
        tournamentId: id,
      });

      if (featuredMatches) {
        data = featuredMatches.data;
      } else {
        data = await service.getLeagueFeaturedEventsByTournament(id);
        for (const item of data) {
          item.homeTeam.image = await getImageUrl(item.homeTeam.id);
          item.awayTeam.image = await getImageUrl(item.awayTeam.id);
        }
        cacheService.setCache(key, data, cacheTTL.ONE_MINUTE);

        const featuredMatches = new FeaturedMatches({
          tournamentId: id,
          data,
        });
        await featuredMatches.save();
      }
    }

    const aggregatedData = await FeaturedMatches.aggregate([
      { $match: { tournamentId: req.params.id } },
      { $unwind: "$data" },
      {
        $project: {
          _id: 0,
          image: 1,
          tournament: {
            name: { $ifNull: ["$data.tournament.name", null] },
            slug: { $ifNull: ["$data.tournament.slug", null] },
            id: { $ifNull: ["$data.tournament.id", null] },
            category: {
              name: { $ifNull: ["$data.tournament.category.name", null] },
              slug: { $ifNull: ["$data.tournament.category.slug", null] },
              id: { $ifNull: ["$data.tournament.category.id", null] },
              country: { $ifNull: ["$data.tournament.category.country", null] },
            },
          },
          customId: { $ifNull: ["$data.customId", null] },
          homeTeam: {
            name: { $ifNull: ["$data.homeTeam.name", null] },
            slug: { $ifNull: ["$data.homeTeam.slug", null] },
            shortName: { $ifNull: ["$data.homeTeam.shortName", null] },
            nameCode: { $ifNull: ["$data.homeTeam.nameCode", null] },
            id: { $ifNull: ["$data.homeTeam.id", null] },
            image: { $ifNull: ["$data.homeTeam.image", null] },
          },
          awayTeam: {
            name: { $ifNull: ["$data.awayTeam.name", null] },
            slug: { $ifNull: ["$data.awayTeam.slug", null] },
            shortName: { $ifNull: ["$data.awayTeam.shortName", null] },
            nameCode: { $ifNull: ["$data.awayTeam.nameCode", null] },
            id: { $ifNull: ["$data.awayTeam.id", null] },
            image: { $ifNull: ["$data.awayTeam.image", null] },
          },
          status: {
            code: { $ifNull: ["$data.status.code", null] },
            description: { $ifNull: ["$data.status.description", null] },
            type: { $ifNull: ["$data.status.type", null] },
          },
          homeScore: {
            current: { $ifNull: ["$data.homeScore.current", null] },
            display: { $ifNull: ["$data.homeScore.display", null] },
            innings: {
              $map: {
                input: { $objectToArray: "$data.homeScore.innings" },
                as: "inning",
                in: {
                  key: "$$inning.k",
                  score: "$$inning.v.score",
                  wickets: "$$inning.v.wickets",
                  overs: "$$inning.v.overs",
                  runRate: "$$inning.v.runRate",
                },
              },
            },
          },
          awayScore: {
            current: { $ifNull: ["$data.awayScore.current", null] },
            display: { $ifNull: ["$data.awayScore.display", null] },
            innings: {
              $map: {
                input: { $objectToArray: "$data.awayScore.innings" },
                as: "inning",
                in: {
                  key: "$$inning.k",
                  score: "$$inning.v.score",
                  wickets: "$$inning.v.wickets",
                  overs: "$$inning.v.overs",
                  runRate: "$$inning.v.runRate",
                },
              },
            },
          },
          season: {
            name: { $ifNull: ["$data.season.name", null] },
            year: { $ifNull: ["$data.season.year", null] },
            id: { $ifNull: ["$data.season.id", null] },
          },
          endTimestamp: { $ifNull: ["$data.endTimestamp", null] },
          startTimestamp: { $ifNull: ["$data.startTimestamp", null] },
          notes: { $ifNull: ["$data.note", null] },
          slug: { $ifNull: ["$data.slug", null] },
          id: { $ifNull: ["$data.id", null] },
          currentBattingTeamId: {
            $ifNull: ["$data.currentBattingTeamId", null],
          },
          tvUmpireName: { $ifNull: ["$data.tvUmpireName", null] },
          venue: { $ifNull: ["$data.venue", null] },
          umpire1Name: { $ifNull: ["$data.umpire1Name", null] },
          umpire2Name: { $ifNull: ["$data.umpire2Name", null] },
          winnerCode: { $ifNull: ["$data.winnerCode", null] },
        },
      },
    ]);

    return apiResponse({
      res,
      data: aggregatedData[0],
      status: true,
      message: "Featured events fetched successfully",
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

    const processPlayerImages = async (playerStatistics) => {
      const categories = [
        "runsScored",
        "battingAverage",
        "battingStrikeRate",
        "hundreds",
        "fifties",
        "fours",
        "sixes",
        "nineties",
        "wickets",
        "bowlingAverage",
        "fiveWicketsHaul",
        "economy",
        "bowlingStrikeRate",
      ];

      for (const category of categories) {
        if (playerStatistics[category]) {
          for (const stat of playerStatistics[category]) {
            const playerId = stat.player.id;
            const folderName = "player";
            const image = await helper.getPlayerImage(playerId);
            if (image) {
              await helper.uploadImageInS3Bucket(
                `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/player/${playerId}/image`,
                folderName,
                playerId
              );
              stat.player.image = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${playerId}`;
            } else {
              stat.player.image = null;
            }
          }
        }
      }
    };

    if (!data) {
      const topPlayers = await TopPlayers.findOne({ tournamentId: id });
      if (topPlayers) {
        const season = topPlayers.seasons.find(
          (season) => season.seasonId === seasonId
        );
        if (season) {
          data = season.playerStatistics;
        } else {
          data = await service.getSeasonTopPlayersByTournament(
            id,
            seasonId,
            positionDetailed
          );
          cacheService.setCache(key, data, cacheTTL.ONE_HOUR);

          // Process player images
          await processPlayerImages(data);

          topPlayers.seasons.push({ seasonId, playerStatistics: data });
          await topPlayers.save();
        }
      } else {
        data = await service.getSeasonTopPlayersByTournament(
          id,
          seasonId,
          positionDetailed
        );
        cacheService.setCache(key, data, cacheTTL.ONE_HOUR);

        // Process player images
        await processPlayerImages(data);

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
                            playerId: "$$run.player.id",
                            image: "$$run.player.image",
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
                            playerId: "$$run.player.id",
                            image: "$$run.player.image",
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
                            playerId: "$$run.player.id",
                            image: "$$run.player.image",
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
                            playerId: "$$run.player.id",
                            image: "$$run.player.image",
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
                            playerId: "$$run.player.id",
                            image: "$$run.player.image",
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
                            playerId: "$$run.player.id",
                            image: "$$run.player.image",
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
                            playerId: "$$run.player.id",
                            image: "$$run.player.image",
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
                            playerId: "$$run.player.id",
                            image: "$$run.player.image",
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
                            playerId: "$$run.player.id",
                            image: "$$run.player.image",
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
                            playerId: "$$run.player.id",
                            image: "$$run.player.image",
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
                            playerId: "$$run.player.id",
                            image: "$$run.player.image",
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
                            playerId: "$$run.player.id",
                            image: "$$run.player.image",
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

    const getImageUrl = async (teamId) => {
      const folderName = "team";
      let imageUrl;
      const image = await helper.getTeamImages(teamId);
      if (image) {
        await helper.uploadImageInS3Bucket(
          `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/team/${teamId}/image`,
          folderName,
          teamId
        );
        imageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${teamId}`;
      } else {
        imageUrl = null;
      }
      return imageUrl;
    };

    if (!data || page > count) {
      if (leagueMatchesData) {
        if (findMatches) {
          if (page <= count) {
            data = findMatches.data;
          } else {
            const newData = await service.getSeasonMatchesByTournament(
              id,
              seasonId,
              span,
              adjustedPage
            );
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

          for (const match of data.events) {
            const homeTeamId = match.homeTeam.id;
            const awayTeamId = match.awayTeam.id;
            match.homeTeam.image = await getImageUrl(homeTeamId);
            match.awayTeam.image = await getImageUrl(awayTeamId);
          }

          leagueMatchesData.seasons.push({ seasonId, data: data.events });
          await leagueMatchesData.save();
        }
      } else {
        const newData = await service.getSeasonMatchesByTournament(
          id,
          seasonId,
          span,
          adjustedPage
        );

        const leagueMatchesEntry = new LeagueMatches({
          tournamentId: id,
          seasons: [{ seasonId: seasonId, data: newData.events }],
        });

        for (const match of newData.events) {
          const homeTeamId = match.homeTeam.id;
          const awayTeamId = match.awayTeam.id;
          match.homeTeam.image = await getImageUrl(homeTeamId);
          match.awayTeam.image = await getImageUrl(awayTeamId);
        }

        await leagueMatchesEntry.save();
        data = leagueMatchesEntry;
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
          tournament: {
            name: { $ifNull: ["$seasons.data.tournament.name", null] },
            slug: { $ifNull: ["$seasons.data.tournament.slug", null] },
            id: { $ifNull: ["$seasons.data.tournament.id", null] },
            category: {
              name: {
                $ifNull: ["$seasons.data.tournament.category.name", null],
              },
              slug: {
                $ifNull: ["$seasons.data.tournament.category.slug", null],
              },
              id: { $ifNull: ["$seasons.data.tournament.category.id", null] },
              country: {
                $ifNull: ["$seasons.data.tournament.category.country", null],
              },
            },
          },
          customId: { $ifNull: ["$seasons.data.customId", null] },
          homeTeam: {
            name: { $ifNull: ["$seasons.data.homeTeam.name", null] },
            slug: { $ifNull: ["$seasons.data.homeTeam.slug", null] },
            shortName: { $ifNull: ["$seasons.data.homeTeam.shortName", null] },
            nameCode: { $ifNull: ["$seasons.data.homeTeam.nameCode", null] },
            id: { $ifNull: ["$seasons.data.homeTeam.id", null] },
            image: { $ifNull: ["$seasons.data.homeTeam.image", null] },
          },
          awayTeam: {
            name: { $ifNull: ["$seasons.data.awayTeam.name", null] },
            slug: { $ifNull: ["$seasons.data.awayTeam.slug", null] },
            shortName: { $ifNull: ["$seasons.data.awayTeam.shortName", null] },
            nameCode: { $ifNull: ["$seasons.data.awayTeam.nameCode", null] },
            id: { $ifNull: ["$seasons.data.awayTeam.id", null] },
            image: { $ifNull: ["$seasons.data.awayTeam.image", null] },
          },
          homeScore: {
            current: { $ifNull: ["$seasons.data.homeScore.current", null] },
            display: { $ifNull: ["$seasons.data.homeScore.display", null] },
            innings: {
              $map: {
                input: { $objectToArray: "$seasons.data.homeScore.innings" },
                as: "inning",
                in: {
                  key: "$$inning.k",
                  score: "$$inning.v.score",
                  wickets: "$$inning.v.wickets",
                  overs: "$$inning.v.overs",
                  runRate: "$$inning.v.runRate",
                },
              },
            },
          },
          awayScore: {
            current: { $ifNull: ["$seasons.data.awayScore.current", null] },
            display: { $ifNull: ["$seasons.data.awayScore.display", null] },
            innings: {
              $map: {
                input: { $objectToArray: "$seasons.data.awayScore.innings" },
                as: "inning",
                in: {
                  key: "$$inning.k",
                  score: "$$inning.v.score",
                  wickets: "$$inning.v.wickets",
                  overs: "$$inning.v.overs",
                  runRate: "$$inning.v.runRate",
                },
              },
            },
          },
          status: {
            code: { $ifNull: ["$seasons.data.status.code", null] },
            description: {
              $ifNull: ["$seasons.data.status.description", null],
            },
            type: { $ifNull: ["$seasons.data.status.type", null] },
          },
          season: {
            name: { $ifNull: ["$seasons.data.season.name", null] },
            year: { $ifNull: ["$seasons.data.season.year", null] },
            id: { $ifNull: ["$seasons.data.season.id", null] },
          },
          notes: { $ifNull: ["$seasons.data.note", null] },
          currentBattingTeamId: {
            $ifNull: ["$seasons.data.currentBattingTeamId", null],
          },
          endTimestamp: { $ifNull: ["$seasons.data.endTimestamp", null] },
          startTimestamp: { $ifNull: ["$seasons.data.startTimestamp", null] },
          slug: { $ifNull: ["$seasons.data.slug", null] },
          tvUmpireName: { $ifNull: ["$seasons.data.tvUmpireName", null] },
          venue: { $ifNull: ["$seasons.data.venue", null] },
          umpire1Name: { $ifNull: ["$seasons.data.umpire1Name", null] },
          umpire2Name: { $ifNull: ["$seasons.data.umpire2Name", null] },
          winnerCode: { $ifNull: ["$seasons.data.winnerCode", null] },
          id: { $ifNull: ["$seasons.data.id", null] },
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
    console.log(error);
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
  getLeagueFeaturedEventsByTournament,
  getMediaByTournament,
  getSeasonInfoByTournament,
  getSeasonStandingByTournament,
  getSeasonTopPlayersByTournament,
  getSeasonMatchesByTournament,
  getTournamentById,
};
