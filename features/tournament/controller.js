import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import cacheService from "../cache/service.js";
import service from "./service.js";
import cacheTTL from "../cache/constants.js";
import TeamSeasonStanding from "./models/TeamStandings.js";

const getSeasonStandingsByTeams = async (req, res, next) => {
  try {
    const { id, seasonId } = req.params;

    const key = cacheService.getCacheKey(req);

    let data = cacheService.getCache(key);

    if (!data) {
      data = await service.getSeasonStandingsByTeams(id, seasonId);

      if (!data) {
        const TeamseasonStanding = await TeamSeasonStanding.findOne({
          tournamentId: id,
          seasonId: seasonId,
        });
        if (TeamseasonStanding) {
          const season = TeamseasonStanding.seasons.find(
            (season) => season.seasonId === seasonId
          );
          if (season) {
            data = season.data;
          } else {
            data = await service.getSeasonStandingsByTeams(id, seasonId);
          }
        }
      } else {
        data = await service.getSeasonStandingsByTeams(id, seasonId);
        cacheService.setCache(key, data, cacheTTL.TEN_SECONDS);

        const seasonStandingEntry = new TeamSeasonStanding({
          tournamentId: id,
          seasons: [{ seasonId: seasonId, data: data.standings }],
        });
        await seasonStandingEntry.save();
      }

      cacheService.setCache(key, data, cacheTTL.ONE_HOUR);
    }

    const seasonStandingData = await TeamSeasonStanding.aggregate([
      { $match: { tournamentId: id, "seasons.seasonId": seasonId } },
      { $unwind: "$seasons" },
      { $match: { "seasons.seasonId": seasonId } },
      {
        $project: {
          name: { $arrayElemAt: ["$seasons.data.tournament.name", 0] },
          uniqueTournamentName: {
            $arrayElemAt: ["$seasons.data.tournament.uniqueTournament.name", 0],
          },
          uniqueTournamentId: {
            $arrayElemAt: ["$seasons.data.tournament.uniqueTournament.id", 0],
          },
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
      message: "Season standings by teams fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No standings found",
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

export default {
  getSeasonStandingsByTeams,
};
