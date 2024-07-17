import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import PlayerDetails from "./models/playerDetailsSchema.js";
import PlayerMatches from "./models/playerMatchesSchema.js";
import PlayerNationalTeamStatistics from "./models/playerNationalTeamStatisticsSchema.js";
import config from "../../config/config.js";
import { uploadFile } from "../../helper/aws_s3.js";
const folderName = "player";

const getPlayerDetailsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);
    let image = cacheService.getCache(key);

    if (!data) {
      data = await service.getPlayerById(id);
      const players = await PlayerDetails.findOne({ PlayerId: id });

      if (players) {
        data = players.data;
      } else {
        const name = id;
        let filename;
        const baseUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`;

        // Check if the image URL already exists
        try {
          const response = await fetch(baseUrl);
          if (response.status !== 200) {
            filename = null;
          } else {
            filename = baseUrl;
          }

          // console.log({ id }, "==> free");
        } catch (error) {
          image = await service.getPlayerImage(id);
          // console.log({ id }, "==> paid");
          await uploadFile({
            filename: `${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`,
            file: image,
            ACL: "public-read",
          });
          filename = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`;
        }

        const playerEntry = new PlayerDetails({
          PlayerId: id,
          image: filename,
          data,
        });
        await playerEntry.save();
      }

      cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
    }

    const teamPlayerData = await PlayerDetails.aggregate([
      { $match: { PlayerId: id } },
      {
        $project: {
          players: {
            $map: {
              input: "$data.player",
              as: "playerObj",
              in: {
                _id: "$_id", // Include MongoDB _id here
                playerName: "$$playerObj.name",
                position: "$$playerObj.position",
                id: "$$playerObj.id",
                country: "$$playerObj.country.name",
                age: "$$playerObj.dateOfBirthTimestamp",
                height: "$$playerObj.height",
                shirtNumber: "$$playerObj.shirtNumber",
                playerQuality: "$$playerObj.cricketPlayerInfo.bowling",
                battingQuality: "$$playerObj.cricketPlayerInfo.batting",
                nationality: "$$playerObj.country.alpha3",
                image: "$image",
                teamName: "$$playerObj.team.name",
              },
            },
          },
        },
      },
    ]);

    return apiResponse({
      res,
      data: teamPlayerData[0].players[0],
      status: true,
      message: "Player details fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No player found",
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

const getPlayerMatchesById = async (req, res, next) => {
  try {
    const { id, span, page } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);
    let image = cacheService.getCache(key);

    if (!data) {
      data = await service.getPlayerMatchesById(id, span, page);
      image = await service.getPlayerImage(id);

      const players = await PlayerMatches.findOne({ playerId: id });
      if (players) {
        data = players.data;
        image = players.image;
      } else {
        const name = id;

        let filename;
        const baseUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`;

        // Check if the image URL already exists
        try {
          const response = await fetch(baseUrl);
          if (response.status !== 200) {
            throw new Error("Image not found");
          }
          filename = baseUrl;
          // console.log({ id }, "==> free");
        } catch (error) {
          image = await service.getPlayerImage(id);
          // console.log({ id }, "==> paid");
          await uploadFile({
            filename: `${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`,
            file: image,
            ACL: "public-read",
          });
          filename = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`;
        }

        const playerEntry = new PlayerMatches({
          playerId: id,
          matches: data.events,
          image: filename,
        });
        await playerEntry.save();
      }

      cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
    }

    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const filterMatches = await PlayerMatches.aggregate([
      { $match: { playerId: id } },
      { $unwind: "$matches" },
      { $skip: skip },
      { $limit: pageSize },

      {
        $project: {
          image: 1,
          playerId: 1,
          tournament: {
            name: { $ifNull: ["$matches.tournament.name", null] },
            slug: { $ifNull: ["$matches.tournament.slug", null] },
            id: { $ifNull: ["$matches.tournament.id", null] },
            category: {
              name: { $ifNull: ["$matches.tournament.category.name", null] },
              slug: { $ifNull: ["$matches.tournament.category.slug", null] },
              id: { $ifNull: ["$matches.tournament.category.id", null] },
              country: {
                $ifNull: ["$matches.tournament.category.country", null],
              },
            },
          },
          customId: { $ifNull: ["$matches.customId", null] },
          homeTeam: {
            name: { $ifNull: ["$matches.homeTeam.name", null] },
            slug: { $ifNull: ["$matches.homeTeam.slug", null] },
            shortName: { $ifNull: ["$matches.homeTeam.shortName", null] },
            nameCode: { $ifNull: ["$matches.homeTeam.nameCode", null] },
            id: { $ifNull: ["$matches.homeTeam.id", null] },
          },
          awayTeam: {
            name: { $ifNull: ["$matches.awayTeam.name", null] },
            slug: { $ifNull: ["$matches.awayTeam.slug", null] },
            shortName: { $ifNull: ["$matches.awayTeam.shortName", null] },
            nameCode: { $ifNull: ["$matches.awayTeam.nameCode", null] },
            id: { $ifNull: ["$matches.awayTeam.id", null] },
          },
          homeScore: {
            current: { $ifNull: ["$matches.homeScore.current", null] },
            display: { $ifNull: ["$matches.homeScore.display", null] },
            innings: {
              $map: {
                input: { $objectToArray: "$matches.homeScore.innings" },
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
            current: { $ifNull: ["$matches.awayScore.current", null] },
            display: { $ifNull: ["$matches.awayScore.display", null] },
            innings: {
              $map: {
                input: { $objectToArray: "$matches.awayScore.innings" },
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
            code: { $ifNull: ["$matches.status.code", null] },
            description: { $ifNull: ["$matches.status.description", null] },
            type: { $ifNull: ["$matches.status.type", null] },
          },
          season: {
            name: { $ifNull: ["$matches.season.name", null] },
            year: { $ifNull: ["$matches.season.year", null] },
            id: { $ifNull: ["$matches.season.id", null] },
          },
          notes: { $ifNull: ["$matches.note", null] },
          currentBattingTeamId: {
            $ifNull: ["$matches.currentBattingTeamId", null],
          },
          endTimestamp: { $ifNull: ["$matches.endTimestamp", null] },
          startTimestamp: { $ifNull: ["$matches.startTimestamp", null] },
          slug: { $ifNull: ["$matches.slug", null] },
          tvUmpireName: { $ifNull: ["$matches.tvUmpireName", null] },
          venue: { $ifNull: ["$matches.venue", null] },
          umpire1Name: { $ifNull: ["$matches.umpire1Name", null] },
          umpire2Name: { $ifNull: ["$matches.umpire2Name", null] },
          winnerCode: { $ifNull: ["$matches.winnerCode", null] },
          id: { $ifNull: ["$matches.id", null] },
        },
      },
    ]);

    return apiResponse({
      res,
      data: filterMatches,
      status: true,
      message: "Player matches fetched successfully",
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

const getNationalTeamStatistics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      const playerNationalTeamStatistics =
        await PlayerNationalTeamStatistics.findOne({ playerId: id });
      if (playerNationalTeamStatistics) {
        data = playerNationalTeamStatistics.data;
      } else {
        data = await service.getNationalTeamStatistics(id);
        const playerNationalTeamStatisticsEntry =
          new PlayerNationalTeamStatistics({
            playerId: id,
            data: data,
          });
        await playerNationalTeamStatisticsEntry.save();
      }
    }

    return apiResponse({
      res,
      data: data?.statistics,
      status: true,
      message: "Player national team statistics fetched successfully",
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
  getPlayerDetailsById,
  getPlayerMatchesById,
  getNationalTeamStatistics,
};
