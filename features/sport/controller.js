import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import sportService from "./service.js";
import cacheTTL from "../cache/constants.js";
import SportList from "./models/sportListSchema.js";
import CountryLeagueList from "./models/countryLeagueListSchema.js";
import BannerSportList from "./models/BannerList.js";
import ScheduleMatches from "./models/sheduleMatchesSchema.js";
import service from "./service.js";
import { uploadFile } from "../../helper/aws_s3.js";
import config from "../../config/config.js";
import axiosInstance from "../../config/axios.config.js";
import RecentMatch from "./models/recentMatchesSchema.js";
// import { verifyToken } from "../../middleware/verifyToken.js";
import helper from "../../helper/common.js";
import PlayerDetails from "../player/models/playerDetailsSchema.js";
import TeamDetails from "../team/models/teamDetailsSchema.js";

const folderName = "country";

const getCountryLeagueList = async (req, res, next) => {
  try {
    const { sport } = req.params;
    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);
    if (!data) {
      const countryLeagueListEntry = await CountryLeagueList.findOne({ sport });
      if (countryLeagueListEntry) {
        data = countryLeagueListEntry.data;
      } else {
        data = await service.getCountryLeagueList(sport);
        await Promise.all(
          data.map(async (item) => {
            let alpha2 = item.alpha2 || undefined;
            const flag = item.flag || undefined;
            const identifier = (alpha2 || flag).toLowerCase();

            if (identifier) {
              const baseUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${identifier}.png`;
              try {
                const response = await fetch(baseUrl);
                if (response.status !== 200) {
                  throw new Error("Image not found");
                }
                item.image = baseUrl;
                // console.log({ identifier }, "==>> free");
              } catch (error) {
                const response = await axiosInstance.get(
                  `/static/images/flags/${identifier}.png`,
                  {
                    responseType: "arraybuffer",
                  }
                );
                // console.log({ identifier }, "==>> paid");
                const buffer = Buffer.from(response.data, "binary");

                await uploadFile({
                  filename: `${config.cloud.digitalocean.rootDirname}/${folderName}/${identifier}.png`,
                  file: buffer,
                  ACL: "public-read",
                });
                const imageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${identifier}.png`;
                item.image = imageUrl;
              }
            }
            return item;
          })
        );

        cacheService.setCache(key, data, cacheTTL.ONE_DAY);

        const fetchAllCategories = async () => {
          const promises = data.map(async (item) => {
            const response = await sportService.getLeagueTournamentList(
              item.id
            );
            item.tournamentlist = response;
            return item;
          });

          const results = await Promise.all(promises);
          return results;
        };
        data = await fetchAllCategories();

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
                image: "$$dataObj.image",
                id: "$$dataObj.id",
                tournamentlist: {
                  $map: {
                    input: "$$dataObj.tournamentlist",
                    as: "tournament",
                    in: {
                      name: "$$tournament.name",
                      slug: "$$tournament.slug",
                      category: {
                        name: "$$tournament.category.name",
                        slug: "$$tournament.category.slug",
                        id: "$$tournament.category.id",
                        flag: "$$tournament.category.flag",
                      },
                      userCount: "$$tournament.userCount",
                      id: "$$tournament.id",
                    },
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
      data: modifyData[0],
      // data:  modifyData[0].data.sort((a, b) => a.name.localeCompare(b.name)),
      status: true,
      message: "Country league list fetched successfully",
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

    const bannerData = await BannerSportList.find();
    var fullUrl = req.protocol + "://" + req.get("host") + "/images/";
    bannerData.forEach((element) => {
      element.bannerImage = element.bannerImage
        ? fullUrl + element.bannerImage
        : "";
    });

    let fildataaa = Object.keys(data).map((key) => {
      return {
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " "),
        live: data[key].live,
        total: data[key].total,
      };
    });

    const formattedData = {
      sportobj: fildataaa,
      bannerdata: bannerData || null,
    };

    return apiResponse({
      res,
      data: formattedData,
      status: true,
      message: "Sport list fetched successfully",
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

const getSportNews = async (req, res, next) => {
  try {
    const { sport } = req.params;
    const news = await sportService.getSportNews(sport);
    return apiResponse({
      res,
      data: news,
      status: true,
      message: "Sport news fetched successfully",
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

const getAllScheduleMatches = async (req, res, next) => {
  try {
    const { sport, date } = req.params;
    const key = cacheService.getCacheKey(req);
    let data = cacheService.getCache(key);
    if (!data) {
      const matches = await ScheduleMatches.findOne({ sport: sport });
      if (matches) {
        const matchesData = matches.data.find((match) => match.date === date);
        if (matchesData) {
          data = matchesData.matches;
        } else {
          data = await sportService.getAllScheduleMatches(sport, date);
          cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
          matches.data.push({ date, matches: data });
          await matches.save();
        }
      } else {
        data = await sportService.getAllScheduleMatches(sport, date);
        cacheService.setCache(key, data, cacheTTL.ONE_DAY);
        const matchesEntry = new ScheduleMatches({
          sport: sport,
          data: [{ date: date, matches: data }],
        });
        await matchesEntry.save();
      }
    }

    const formattedData = data?.events?.map((match) => ({
      tournament: {
        name: match.tournament?.name || null,
        slug: match.tournament?.slug || null,
        id: match.tournament?.id || null,
        category: {
          name: match.tournament?.category?.name || null,
          slug: match.tournament?.category?.slug || null,
          id: match.tournament?.category?.id || null,
          country: match.tournament?.category?.country || null,
        },
      },
      customId: match.customId || null,
      homeTeam: {
        name: match.homeTeam?.name || null,
        slug: match.homeTeam?.slug || null,
        shortName: match.homeTeam?.shortName || null,
        nameCode: match.homeTeam?.nameCode || null,
        id: match.homeTeam?.id || null,
      },
      awayTeam: {
        name: match.awayTeam?.name || null,
        slug: match.awayTeam?.slug || null,
        shortName: match.awayTeam?.shortName || null,
        nameCode: match.awayTeam?.nameCode || null,
        id: match.awayTeam?.id || null,
      },
      homeScore: {
        current: match.homeScore?.current || null,
        display: match.homeScore?.display || null,
        innings: match.homeScore?.innings
          ? Object.entries(match.homeScore.innings).map(([key, value]) => ({
              key,
              score: value.score,
              wickets: value.wickets,
              overs: value.overs,
              runRate: value.runRate,
            }))
          : [],
      },
      awayScore: {
        current: match.awayScore?.current || null,
        display: match.awayScore?.display || null,
        innings: match.awayScore?.innings
          ? Object.entries(match.awayScore.innings).map(([key, value]) => ({
              key,
              score: value.score,
              wickets: value.wickets,
              overs: value.overs,
              runRate: value.runRate,
            }))
          : [],
      },
      status: {
        code: match.status?.code || null,
        description: match.status?.description || null,
        type: match.status?.type || null,
      },
      season: {
        name: match.season?.name || null,
        year: match.season?.year || null,
        id: match.season?.id || null,
      },
      notes: match.note || null,
      currentBattingTeamId: match.currentBattingTeamId || null,
      endTimestamp: match.endTimestamp || null,
      startTimestamp: match.startTimestamp || null,
      slug: match.slug || null,
      tvUmpireName: match.tvUmpireName || null,
      venue: match.venue || null,
      umpire1Name: match.umpire1Name || null,
      umpire2Name: match.umpire2Name || null,
      winnerCode: match.winnerCode || null,
      id: match.id || null,
    }));

    const currentDate = new Date().toISOString().split("T")[0];
    let filteredStatusData;
    if (currentDate === date) {
      const filterSameDateData = formattedData.filter((item) =>
        ["notstarted", "inprogress", "finished", "canceled"].includes(
          item.status.type
        )
      );
      filteredStatusData = filterSameDateData.sort(
        (a, b) =>
          ["notstarted", "inprogress", "finished", "canceled"].indexOf(
            a.status.type
          ) -
          ["notstarted", "inprogress", "finished", "canceled"].indexOf(
            b.status.type
          )
      );
    } else if (currentDate > date) {
      const filterPreviousDateData = formattedData.filter((item) =>
        ["finished", "canceled"].includes(item.status.type)
      );
      filteredStatusData = filterPreviousDateData.sort(
        (a, b) =>
          ["notstarted", "inprogress", "finished", "canceled"].indexOf(
            a.status.type
          ) -
          ["notstarted", "inprogress", "finished", "canceled"].indexOf(
            b.status.type
          )
      );
    } else {
      filteredStatusData = formattedData.filter(
        (item) => item.status.type === "notstarted"
      );
    }

    return apiResponse({
      res,
      data: filteredStatusData,
      status: true,
      message: "All matches fetched successfully",
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

const getRecentMatches = async (req, res, next) => {
  try {
    const { sport } = req.params;
    const authHeader = req.headers?.authorization;
    const token = authHeader?.split(" ")[1];
    const { userId } = await helper.verifyToken(token);
    let recentMatches;
    if (userId) {
      const userAllRecentMatches = await RecentMatch.findOne({ userId });
      if (userAllRecentMatches) {
        const userRecentMatches = userAllRecentMatches?.data?.find(
          (item) => item.sport === sport
        );
        console.log("userRecentMatches", userRecentMatches?.data);
        recentMatches = userRecentMatches?.data;
      }
    }

    return apiResponse({
      res,
      data: recentMatches ? recentMatches : [],
      status: true,
      message: "Recent matches fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: [],
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

const globalSearch = async (req, res, next) => {
  try {
    const { type, text } = req.body;
    let data;
    if (type === "player") {
      const players = await PlayerDetails.aggregate([
        { $match: { "data.player.name": { $regex: text, $options: "i" } } },
        {
          $project: {
            players: {
              $map: {
                input: "$data",
                as: "dataObj",
                in: {
                  runsScored: { $ifNull: ["$$dataObj.runsScored", null] },
                  player: { $ifNull: ["$$dataObj.player.name", null] },
                  position: { $ifNull: ["$$dataObj.player.position", null] },
                  playerId: { $ifNull: ["$$dataObj.player.id", null] },
                  sport: {
                    $ifNull: ["$$dataObj.player.team.sport.name", null],
                  },
                },
              },
            },
          },
        },
      ]);
      data = players.map((player) => player.players).flat();
    } else if (type === "team") {
      const teams = await TeamDetails.aggregate([
        { $match: { "data.team.name": { $regex: text, $options: "i" } } },
        {
          $project: {
            team: {
              //This data only sending null  because of frontend side use standing model
              position: { $ifNull: ["$data.team.position", null] },
              matches: { $ifNull: ["$data.team.matches", null] },
              draws: { $ifNull: ["$data.team.draws", null] },
              losses: { $ifNull: ["$data.team.losses", null] },
              points: { $ifNull: ["$data.team.points", null] },
              netRunRate: { $ifNull: ["$data.team.netRunRate", null] },
              noResult: { $ifNull: ["$data.team.noResult", null] },
              wins: { $ifNull: ["$data.team.wins", null] },

              //The data is coming from here
              id: { $ifNull: ["$data.team.id", null] },
              shortName: { $ifNull: ["$data.team.shortName", null] },
              teamName: { $ifNull: ["$data.team.name", null] },
              sport: { $ifNull: ["$data.team.sport.name", null] },
            },
          },
        },
      ]);
      data = teams.map((team) => team.team);
    } else if (type === "tournament") {
      const tournaments = await CountryLeagueList.aggregate([
        { $unwind: "$data" },
        { $unwind: "$data.tournamentlist" },
        {
          $match: {
            "data.tournamentlist.name": { $regex: text, $options: "i" },
          },
        },
        {
          $project: {
            name: "$data.tournamentlist.name",
            id: "$data.tournamentlist.id",
            slug: "$data.tournamentlist.slug",
            category: {
              name: "$data.tournamentlist.category.name",
              slug: "$data.tournamentlist.category.slug",
              id: "$data.tournamentlist.category.id",
              flag: "$data.tournamentlist.category.flag",
            },
            userCount: "$data.tournamentlist.userCount",
            sport: "$data.tournamentlist.category.sport.name",
          },
        },
      ]);
      data = tournaments;
    } else {
      return apiResponse({
        res,
        status: false,
        message: "Invalid type parameter",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    return apiResponse({
      res,
      data: data,
      status: true,
      message: `${
        type.charAt(0).toUpperCase() + type.slice(1)
      } list fetched successfully`,
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
  getSportNews,
  getAllScheduleMatches,
  getRecentMatches,
  globalSearch,
};
