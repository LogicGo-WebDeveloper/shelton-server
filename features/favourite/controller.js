import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import FavouriteDetails from "./models/favouriteDetails.js";
import FavouritePlayerDetails from "./models/favouritePlayerDetails.js";
import FavouriteTeamDetails from "./models/favouriteTeamDetails.js";
import favouriteLeagueDetails from "./models/favouriteLeagueDetails.js";

const favouriteMatchesadd = async (req, res, next) => {
  try {
    const matchesId = req.body.matchesId;
    const userId = req.body.userId;
    const type = req.body.type;

    // Check if the document already exists in the collection
    const existingFavourite = await FavouriteDetails.findOne({
      matchesId: matchesId,
    });

    if (existingFavourite) {
      // Toggle the status field
      const newStatus = existingFavourite.status === true ? false : true;

      // Update the document with the new status and type
      const updatedFavourite = await FavouriteDetails.updateOne(
        { matchesId: matchesId },
        { type: type, status: newStatus }
      );

      const allExistingFavourite = await FavouriteDetails.findOne({
        matchesId: matchesId,
      });

      return apiResponse({
        res,
        data: allExistingFavourite,
        status: true,
        message:
          newStatus === false
            ? "Favorite matches remove successfully"
            : "Favorite matches added successfully",
        statusCode: StatusCodes.OK,
      });
    } else {
      // If document does not exist, create a new one with status 1
      const newFavourite = await FavouriteDetails.create({
        matchesId: matchesId,
        userId: userId,
        status: 1, // Set initial status to 1
        type: type,
        // Additional fields can be added here
      });

      return apiResponse({
        res,
        data: newFavourite,
        status: true,
        message: "Favorite matches added successfully",
        statusCode: StatusCodes.OK,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return apiResponse({
      res,
      status: false,
      message: "Internal server error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const favouriteMatcheslist = async (req, res, next) => {
  try {
    // Fetch data using populate and select
    const favoriteMatchList = await FavouriteDetails.find({ status: 1 })
      .populate({
        path: "matchesId",
        model: "MatcheDetailsByMatchScreen",
        select: "data",
      })
      .exec();
    console.log(favoriteMatchList);

    // Map through favoriteMatchList to reshape data
    const reshapedData = favoriteMatchList.map((favourite) => {
      return {
        _id: favourite.matchesId._id,
        tournament: {
          name: favourite.matchesId.data.event.tournament.name,
          slug: favourite.matchesId.data.event.tournament.slug,
          id: favourite.matchesId.data.event.tournament.id,
          category: {
            name: favourite.matchesId.data.event.tournament.category.name,
            slug: favourite.matchesId.data.event.tournament.category.slug,
            id: favourite.matchesId.data.event.tournament.category.id,
            country: favourite.matchesId.data.event.tournament.category.country,
          },
        },
        customId: favourite.matchesId.data.event.customId,
        homeTeam: {
          name: favourite.matchesId.data.event.homeTeam.name,
          slug: favourite.matchesId.data.event.homeTeam.slug,
          shortName: favourite.matchesId.data.event.homeTeam.shortName,
          nameCode: favourite.matchesId.data.event.homeTeam.nameCode,
          id: favourite.matchesId.data.event.homeTeam.id,
        },
        awayTeam: {
          name: favourite.matchesId.data.event.awayTeam.name,
          slug: favourite.matchesId.data.event.awayTeam.slug,
          shortName: favourite.matchesId.data.event.awayTeam.shortName,
          nameCode: favourite.matchesId.data.event.awayTeam.nameCode,
          id: favourite.matchesId.data.event.awayTeam.id,
        },
        homeScore: {
          current: favourite.matchesId.data.event.homeScore.current,
          display: favourite.matchesId.data.event.homeScore.display,
          innings: Object.entries(
            favourite.matchesId.data.event.homeScore.innings
          ).map(([key, value]) => ({
            key,
            score: value.score,
            wickets: value.wickets,
            overs: value.overs,
            runRate: value.runRate,
          })),
        },
        awayScore: {
          current: favourite.matchesId.data.event.awayScore.current,
          display: favourite.matchesId.data.event.awayScore.display,
          innings: Object.entries(
            favourite.matchesId.data.event.awayScore.innings
          ).map(([key, value]) => ({
            key,
            score: value.score,
            wickets: value.wickets,
            overs: value.overs,
            runRate: value.runRate,
          })),
        },
        status: {
          code: favourite.matchesId.data.event.status.code,
          description: favourite.matchesId.data.event.status.description,
          type: favourite.matchesId.data.event.status.type,
        },
        season: {
          name: favourite.matchesId.data.event.season.name,
          year: favourite.matchesId.data.event.season.year,
          id: favourite.matchesId.data.event.season.id,
        },
        notes: favourite.matchesId.data.event.note,
        currentBattingTeamId:
          favourite.matchesId.data.event.currentBattingTeamId,
        endTimestamp: favourite.matchesId.data.event.endTimestamp,
        startTimestamp: favourite.matchesId.data.event.startTimestamp,
        slug: favourite.matchesId.data.event.slug,
        tvUmpireName: favourite.matchesId.data.event.tvUmpireName,
        venue: favourite.matchesId.data.event.venue,
        umpire1Name: favourite.matchesId.data.event.umpire1Name,
        umpire2Name: favourite.matchesId.data.event.umpire2Name,
        winnerCode: favourite.matchesId.data.event.winnerCode,
        id: favourite.matchesId.data.event.id,
        is_favourite: favourite.status,
      };
    });

    if (favoriteMatchList) {
      return apiResponse({
        res,
        data: reshapedData,
        status: true,
        message: "Favourite matches fetched successfully ",
        statusCode: StatusCodes.OK,
      });
    }
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No overs found",
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

const favouritePlayersadd = async (req, res, next) => {
  try {
    const playerId = req.body.playerId;
    const userId = req.body.userId;
    const type = req.body.type;

    const existingFavourite = await FavouritePlayerDetails.findOne({
      playerId: playerId,
    });

    if (existingFavourite) {
      // Toggle the status field
      const newStatus = existingFavourite.status === true ? false : true;

      // Update the document with the new status and type
      const updatedFavourite = await FavouritePlayerDetails.updateOne(
        { playerId: playerId },
        { type: type, status: newStatus }
      );

      const allExistingFavourite = await FavouritePlayerDetails.findOne({
        playerId: playerId,
      });

      return apiResponse({
        res,
        data: allExistingFavourite,
        status: true,
        message:
          newStatus === false
            ? "Favorite player removed successfully"
            : "Favorite player added successfully",
        statusCode: StatusCodes.OK,
      });
    } else {
      // If document does not exist, create a new one with status 1
      const newFavourite = await FavouritePlayerDetails.create({
        playerId: playerId,
        userId: userId,
        status: 1, // Set initial status to 1
        type: type,
        // Additional fields can be added here
      });

      return apiResponse({
        res,
        data: newFavourite,
        status: true,
        message: "Favorite player added successfully",
        statusCode: StatusCodes.OK,
      });
    }
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

const favouritePlayerlist = async (req, res, next) => {
  try {
    // Fetch data using populate and select
    const favoritePlayerList = await FavouritePlayerDetails.find({
      status: true,
    })
      .populate({
        path: "playerId",
        model: "PlayerDetails",
        select: "data",
      })
      .exec();

    // Map through favoriteMatchList to reshape data
    const reshapedData = favoritePlayerList.map((favourite) => {
      return {
        player: {
          _id: favourite.playerId._id,
          name: favourite.playerId.data[0].player.name,
          slug: favourite.playerId.data[0].player.slug,
          id: favourite.playerId.data[0].player.id,
          position: favourite.playerId.data[0].player.position,
          is_favourite: favourite.status,

          // category: {
          //   name: favourite.playerId.data.player.category.name,
          //   slug: favourite.playerId.data.player.category.slug,
          //   id: favourite.playerId.data.player.category.id,
          //   country: favourite.playerId.data.player.category.country,
          // },
        },
        // customId: favourite.playerId.data.player.customId,
        // homeTeam: {
        //   name: favourite.playerId.data.player.homeTeam.name,
        //   slug: favourite.playerId.data.player.homeTeam.slug,
        //   shortName: favourite.playerId.data.player.homeTeam.shortName,
        //   nameCode: favourite.playerId.data.player.homeTeam.nameCode,
        //   id: favourite.playerId.data.player.homeTeam.id,
        // },
        // awayTeam: {
        //   name: favourite.playerId.data.player.awayTeam.name,
        //   slug: favourite.playerId.data.player.awayTeam.slug,
        //   shortName: favourite.playerId.data.player.awayTeam.shortName,
        //   nameCode: favourite.playerId.data.player.awayTeam.nameCode,
        //   id: favourite.playerId.data.player.awayTeam.id,
        // },
        // homeScore: {
        //   current: favourite.playerId.data.player.homeScore.current,
        //   display: favourite.playerId.data.player.homeScore.display,
        //   innings: Object.entries(
        //     favourite.playerId.data.player.homeScore.innings
        //   ).map(([key, value]) => ({
        //     key,
        //     score: value.score,
        //     wickets: value.wickets,
        //     overs: value.overs,
        //     runRate: value.runRate,
        //   })),
        // },
        // awayScore: {
        //   current: favourite.playerId.data.player.awayScore.current,
        //   display: favourite.playerId.data.player.awayScore.display,
        //   innings: Object.entries(
        //     favourite.playerId.data.player.awayScore.innings
        //   ).map(([key, value]) => ({
        //     key,
        //     score: value.score,
        //     wickets: value.wickets,
        //     overs: value.overs,
        //     runRate: value.runRate,
        //   })),
        // },
        // status: {
        //   code: favourite.playerId.data.player.status.code,
        //   description: favourite.playerId.data.player.status.description,
        //   type: favourite.playerId.data.player.status.type,
        // },
        // season: {
        //   name: favourite.playerId.data.player.season.name,
        //   year: favourite.playerId.data.player.season.year,
        //   id: favourite.playerId.data.player.season.id,
        // },
        // notes: favourite.playerId.data.player.note,
        // currentBattingTeamId:
        //   favourite.playerId.data.player.currentBattingTeamId,
        // endTimestamp: favourite.playerId.data.player.endTimestamp,
        // startTimestamp: favourite.playerId.data.player.startTimestamp,
        // slug: favourite.playerId.data.player.slug,
        // tvUmpireName: favourite.playerId.data.player.tvUmpireName,
        // venue: favourite.playerId.data.player.venue,
        // umpire1Name: favourite.playerId.data.player.umpire1Name,
        // umpire2Name: favourite.playerId.data.player.umpire2Name,
        // winnerCode: favourite.playerId.data.player.winnerCode,
        // id: favourite.playerId.data.player.id,
      };
    });

    if (favoritePlayerList) {
      return apiResponse({
        res,
        data: reshapedData,
        status: true,
        message: "Favourite Player fetched successfully ",
        statusCode: StatusCodes.OK,
      });
    }
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No overs found",
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

const favouriteTeamsadd = async (req, res, next) => {
  try {
    const teamId = req.body.teamId;
    const userId = req.body.userId;
    const type = req.body.type;

    const existingFavourite = await FavouriteTeamDetails.findOne({
      teamId: teamId,
    });

    if (existingFavourite) {
      // Toggle the status field
      const newStatus = existingFavourite.status === true ? false : true;

      // Update the document with the new status and type
      const updatedFavourite = await FavouriteTeamDetails.updateOne(
        { teamId: teamId },
        { type: type, status: newStatus }
      );

      const allExistingFavourite = await FavouriteTeamDetails.findOne({
        teamId: teamId,
      });

      return apiResponse({
        res,
        data: allExistingFavourite,
        status: true,
        message:
          newStatus === false
            ? "Favorite team removed successfully"
            : "Favorite team added successfully",
        statusCode: StatusCodes.OK,
      });
    } else {
      // If document does not exist, create a new one with status 1
      const newFavourite = await FavouriteTeamDetails.create({
        teamId: teamId,
        userId: userId,
        status: 1, // Set initial status to 1
        type: type,
        // Additional fields can be added here
      });

      return apiResponse({
        res,
        data: newFavourite,
        status: true,
        message: "Favorite team added successfully",
        statusCode: StatusCodes.OK,
      });
    }
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No team found",
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

const favouriteTeamList = async (req, res, next) => {
  try {
    // Fetch data using populate and select
    const favoriteTeamList = await FavouriteTeamDetails.find({ status: 1 })
      .populate({
        path: "teamId",
        model: "TeamDetails",
        select: "data",
      })
      .exec();

    // Map through favoriteMatchList to reshape data
    const reshapedData = favoriteTeamList.map((favourite) => {
      return {
        team: {
          _id: favourite.teamId._id,
          name: favourite.teamId.data.team.name,
          slug: favourite.teamId.data.team.slug,
          id: favourite.teamId.data.team.id,
          shortName: favourite.teamId.data.team.shortName,
          is_favourite: favourite.status,
          // category: {
          //   name: favourite.teamId.data.player.category.name,
          //   slug: favourite.playerId.data.player.category.slug,
          //   id: favourite.playerId.data.player.category.id,
          //   country: favourite.playerId.data.player.category.country,
          // },
        },
        // customId: favourite.playerId.data.player.customId,
        // homeTeam: {
        //   name: favourite.playerId.data.player.homeTeam.name,
        //   slug: favourite.playerId.data.player.homeTeam.slug,
        //   shortName: favourite.playerId.data.player.homeTeam.shortName,
        //   nameCode: favourite.playerId.data.player.homeTeam.nameCode,
        //   id: favourite.playerId.data.player.homeTeam.id,
        // },
        // awayTeam: {
        //   name: favourite.playerId.data.player.awayTeam.name,
        //   slug: favourite.playerId.data.player.awayTeam.slug,
        //   shortName: favourite.playerId.data.player.awayTeam.shortName,
        //   nameCode: favourite.playerId.data.player.awayTeam.nameCode,
        //   id: favourite.playerId.data.player.awayTeam.id,
        // },
        // homeScore: {
        //   current: favourite.playerId.data.player.homeScore.current,
        //   display: favourite.playerId.data.player.homeScore.display,
        //   innings: Object.entries(
        //     favourite.playerId.data.player.homeScore.innings
        //   ).map(([key, value]) => ({
        //     key,
        //     score: value.score,
        //     wickets: value.wickets,
        //     overs: value.overs,
        //     runRate: value.runRate,
        //   })),
        // },
        // awayScore: {
        //   current: favourite.playerId.data.player.awayScore.current,
        //   display: favourite.playerId.data.player.awayScore.display,
        //   innings: Object.entries(
        //     favourite.playerId.data.player.awayScore.innings
        //   ).map(([key, value]) => ({
        //     key,
        //     score: value.score,
        //     wickets: value.wickets,
        //     overs: value.overs,
        //     runRate: value.runRate,
        //   })),
        // },
        // status: {
        //   code: favourite.playerId.data.player.status.code,
        //   description: favourite.playerId.data.player.status.description,
        //   type: favourite.playerId.data.player.status.type,
        // },
        // season: {
        //   name: favourite.playerId.data.player.season.name,
        //   year: favourite.playerId.data.player.season.year,
        //   id: favourite.playerId.data.player.season.id,
        // },
        // notes: favourite.playerId.data.player.note,
        // currentBattingTeamId:
        //   favourite.playerId.data.player.currentBattingTeamId,
        // endTimestamp: favourite.playerId.data.player.endTimestamp,
        // startTimestamp: favourite.playerId.data.player.startTimestamp,
        // slug: favourite.playerId.data.player.slug,
        // tvUmpireName: favourite.playerId.data.player.tvUmpireName,
        // venue: favourite.playerId.data.player.venue,
        // umpire1Name: favourite.playerId.data.player.umpire1Name,
        // umpire2Name: favourite.playerId.data.player.umpire2Name,
        // winnerCode: favourite.playerId.data.player.winnerCode,
        // id: favourite.playerId.data.player.id,
      };
    });

    if (favoriteTeamList) {
      return apiResponse({
        res,
        data: reshapedData,
        status: true,
        message: "Favourite fetched successfully ",
        statusCode: StatusCodes.OK,
      });
    }
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No overs found",
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

const favouriteLeagueadd = async (req, res, next) => {
  try {
    const leagueId = req.body.leagueId;
    const userId = req.body.userId;
    const type = req.body.type;

    const existingFavourite = await favouriteLeagueDetails.findOne({
      leagueId: leagueId,
    });

    if (existingFavourite) {
      // Toggle the status field
      const newStatus = existingFavourite.status === true ? false : true;

      // Update the document with the new status and type
      const updatedFavourite = await favouriteLeagueDetails.updateOne(
        { leagueId: leagueId },
        { type: type, status: newStatus }
      );

      const allexistingFavourite = await favouriteLeagueDetails.findOne({
        leagueId: leagueId,
      });

      return apiResponse({
        res,
        data: allexistingFavourite,
        status: true,
        message:
          newStatus === false
            ? "Favorite league removed successfully"
            : "Favorite league added successfully",
        statusCode: StatusCodes.OK,
      });
    } else {
      // If document does not exist, create a new one with status 1
      const newFavourite = await favouriteLeagueDetails.create({
        leagueId: leagueId,
        userId: userId,
        status: 1, // Set initial status to 1
        type: type,
        // Additional fields can be added here
      });

      return apiResponse({
        res,
        data: newFavourite,
        status: true,
        message: "Favorite league added successfully",
        statusCode: StatusCodes.OK,
      });
    }
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No league found",
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

const favouriteLeagueList = async (req, res, next) => {
  try {
    // Fetch data using populate and select
    const favoriteTeamList = await favouriteLeagueDetails
      .find({ status: 1 })
      .populate({
        path: "leagueId",
        model: "Tournament",
        select: "data",
      })
      .exec();

    // Map through favoriteMatchList to reshape data
    const reshapedData = favoriteTeamList.map((favourite) => {
      console.log(favourite);
      return {
        league: {
          _id: favourite.leagueId._id,
          name: favourite.leagueId.data[0].name,
          slug: favourite.leagueId.data[0].slug,
          id: favourite.leagueId.data[0].id,
          categoryName: favourite.leagueId.data[0].category.name,
          sportName: favourite.leagueId.data[0].category.sport.name,
          is_favourite: favourite.status,

          // category: {
          //   name: favourite.teamId.data.player.category.name,
          //   slug: favourite.playerId.data.player.category.slug,
          //   id: favourite.playerId.data.player.category.id,
          //   country: favourite.playerId.data.player.category.country,
          // },
          // },
          // customId: favourite.playerId.data.player.customId,
          // homeTeam: {
          //   name: favourite.playerId.data.player.homeTeam.name,
          //   slug: favourite.playerId.data.player.homeTeam.slug,
          //   shortName: favourite.playerId.data.player.homeTeam.shortName,
          //   nameCode: favourite.playerId.data.player.homeTeam.nameCode,
          //   id: favourite.playerId.data.player.homeTeam.id,
        },
        // awayTeam: {
        //   name: favourite.playerId.data.player.awayTeam.name,
        //   slug: favourite.playerId.data.player.awayTeam.slug,
        //   shortName: favourite.playerId.data.player.awayTeam.shortName,
        //   nameCode: favourite.playerId.data.player.awayTeam.nameCode,
        //   id: favourite.playerId.data.player.awayTeam.id,
        // },
        // homeScore: {
        //   current: favourite.playerId.data.player.homeScore.current,
        //   display: favourite.playerId.data.player.homeScore.display,
        //   innings: Object.entries(
        //     favourite.playerId.data.player.homeScore.innings
        //   ).map(([key, value]) => ({
        //     key,
        //     score: value.score,
        //     wickets: value.wickets,
        //     overs: value.overs,
        //     runRate: value.runRate,
        //   })),
        // },
        // awayScore: {
        //   current: favourite.playerId.data.player.awayScore.current,
        //   display: favourite.playerId.data.player.awayScore.display,
        //   innings: Object.entries(
        //     favourite.playerId.data.player.awayScore.innings
        //   ).map(([key, value]) => ({
        //     key,
        //     score: value.score,
        //     wickets: value.wickets,
        //     overs: value.overs,
        //     runRate: value.runRate,
        //   })),
        // },
        // status: {
        //   code: favourite.playerId.data.player.status.code,
        //   description: favourite.playerId.data.player.status.description,
        //   type: favourite.playerId.data.player.status.type,
        // },
        // season: {
        //   name: favourite.playerId.data.player.season.name,
        //   year: favourite.playerId.data.player.season.year,
        //   id: favourite.playerId.data.player.season.id,
        // },
        // notes: favourite.playerId.data.player.note,
        // currentBattingTeamId:
        //   favourite.playerId.data.player.currentBattingTeamId,
        // endTimestamp: favourite.playerId.data.player.endTimestamp,
        // startTimestamp: favourite.playerId.data.player.startTimestamp,
        // slug: favourite.playerId.data.player.slug,
        // tvUmpireName: favourite.playerId.data.player.tvUmpireName,
        // venue: favourite.playerId.data.player.venue,
        // umpire1Name: favourite.playerId.data.player.umpire1Name,
        // umpire2Name: favourite.playerId.data.player.umpire2Name,
        // winnerCode: favourite.playerId.data.player.winnerCode,
        // id: favourite.playerId.data.player.id,
      };
    });

    if (favoriteTeamList) {
      return apiResponse({
        res,
        data: reshapedData,
        status: true,
        message: "Favourite fetched successfully ",
        statusCode: StatusCodes.OK,
      });
    }
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status === 404) {
      return apiResponse({
        res,
        data: null,
        status: true,
        message: "No overs found",
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
  favouriteMatchesadd,
  favouritePlayersadd,
  favouriteTeamsadd,
  favouriteMatcheslist,
  favouritePlayerlist,
  favouriteTeamList,
  favouriteLeagueadd,
  favouriteLeagueList,
};
