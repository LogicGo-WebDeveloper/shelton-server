import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import sportService from "./service.js";
import cacheTTL from "../cache/constants.js";
import SportList from "./models/sportListSchema.js";
import CountryLeagueList from "./models/countryLeagueListSchema.js";
import BannerSportList from "./models/BannerList.js";
import ScheduleMatches from "./models/sheduleMatchesSchema.js";

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
        data = await sportService.getCountryLeagueList(sport);
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
    console.log("________", sport)
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
      // console.log("______________>>>>", error)
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
        if(matchesData){
          data = matchesData.matches;
        }else{
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

    const formattedData = data?.events?.map(match => ({
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
        innings: match.homeScore?.innings ? Object.entries(match.homeScore.innings).map(([key, value]) => ({
          key,
          score: value.score,
          wickets: value.wickets,
          overs: value.overs,
          runRate: value.runRate,
        })) : [],
      },
      awayScore: {
        current: match.awayScore?.current || null,
        display: match.awayScore?.display || null,
        innings: match.awayScore?.innings ? Object.entries(match.awayScore.innings).map(([key, value]) => ({
          key,
          score: value.score,
          wickets: value.wickets,
          overs: value.overs,
          runRate: value.runRate,
        })) : [],
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

    return apiResponse({ 
      res, 
      data: formattedData, 
      status: true, 
      message: "All matches fetched successfully", 
      statusCode: StatusCodes.OK 
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
  getAllScheduleMatches
};
