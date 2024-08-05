import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import CustomMatch from "../models/match.models.js";
import {
  updateMatchScorecardDetails,
  validateEntitiesExistence,
  validateObjectIds,
} from "../utils/utils.js";
import CustomTournament from "../models/tournament.models.js";
import {
  CustomCityList,
  CustomMatchOfficial,
  CustomMatchStatus,
} from "../models/common.models.js";
import CustomTeam from "../models/team.models.js";
import helper from "../../helper/common.js";
import CustomPlayers from "../models/player.models.js";
import enums from "../../config/enum.js";
import config from "../../config/enum.js";
import customUmpireList from "../models/umpire.models.js";
import CustomMatchScorecard from "../models/matchScorecard.models.js";
import mongoose from "mongoose";

const createMatch = async (req, res, next) => {
  try {
    const {
      homeTeamId,
      awayTeamId,
      tournamentId,
      noOfOvers,
      overPerBowler,
      city,
      ground,
      dateTime,
      homeTeamPlayingPlayer,
      awayTeamPlayingPlayer,
      umpires,
    } = req.body;
    const userId = req.user._id;

    const validation = validateObjectIds({
      homeTeamId,
      awayTeamId,
      city,
    });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Validate minimum 11 players for each team
    if (
      !Array.isArray(homeTeamPlayingPlayer) ||
      homeTeamPlayingPlayer.length < 11 ||
      !Array.isArray(awayTeamPlayingPlayer) ||
      awayTeamPlayingPlayer.length < 11
    ) {
      return apiResponse({
        res,
        status: false,
        message: "Both teams must have at least 11 players",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Validate umpire list
    if (!Array.isArray(umpires) || umpires.length === 0) {
      return apiResponse({
        res,
        status: false,
        message: "Umpire list must be a non-empty array",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Check for duplicate players between teams
    const duplicatePlayers = homeTeamPlayingPlayer.filter((player) =>
      awayTeamPlayingPlayer.includes(player)
    );
    if (duplicatePlayers.length > 0) {
      return apiResponse({
        res,
        status: false,
        message: "A player cannot be in both teams",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Check for duplicate umpires
    const uniqueUmpires = new Set(umpires);
    if (uniqueUmpires.size !== umpires.length) {
      return apiResponse({
        res,
        status: false,
        message: "Duplicate umpires are not allowed",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const findCity = await CustomCityList.findById(city);
    const findHomeTeam = await CustomTeam.findById(homeTeamId);
    const findAwayTeam = await CustomTeam.findById(awayTeamId);

    if (tournamentId) {
      const tournament = await CustomTournament.findById(tournamentId);
      if (!tournament) {
        return apiResponse({
          res,
          status: true,
          message: "Tournament not found",
          statusCode: StatusCodes.NOT_FOUND,
        });
      }
    }
    if (!findCity) {
      return apiResponse({
        res,
        status: true,
        message: "City not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    if (!findHomeTeam) {
      return apiResponse({
        res,
        status: true,
        message: "Home Team not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    if (!findAwayTeam) {
      return apiResponse({
        res,
        status: true,
        message: "Away Team not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Validate all player IDs and umpire IDs
    const allIds = [
      ...homeTeamPlayingPlayer,
      ...awayTeamPlayingPlayer,
      ...umpires,
    ];

    // Function to validate MongoDB ObjectId format
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    // Filter out invalid IDs
    const invalidIds = allIds.filter((id) => !isValidObjectId(id));

    if (invalidIds.length > 0) {
      return apiResponse({
        res,
        status: false,
        message: `The following IDs are invalid: ${invalidIds.join(", ")}`,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Validate players and umpires exist
    const validEntities = await Promise.all([
      CustomPlayers.find({
        _id: { $in: [...homeTeamPlayingPlayer, ...awayTeamPlayingPlayer] },
      }),
      customUmpireList.find({ umpireId: { $in: umpires } }),
    ]);

    const [validPlayers, validUmpires] = validEntities;

    if (
      validPlayers.length !==
      homeTeamPlayingPlayer.length + awayTeamPlayingPlayer.length
    ) {
      const foundPlayerIds = validPlayers.map((player) =>
        player._id.toString()
      );
      const notFoundPlayerIds = [
        ...homeTeamPlayingPlayer,
        ...awayTeamPlayingPlayer,
      ].filter((id) => !foundPlayerIds.includes(id));
      return apiResponse({
        res,
        status: false,
        message: `The following player IDs were not found: ${notFoundPlayerIds.join(
          ", "
        )}`,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (validUmpires.length !== umpires.length) {
      const foundUmpireIds = validUmpires.map((umpire) =>
        umpire.umpireId.toString()
      );
      const notFoundUmpireIds = umpires.filter(
        (id) => !foundUmpireIds.includes(id)
      );

      if (notFoundUmpireIds.length > 0) {
        return apiResponse({
          res,
          status: false,
          message: `The following umpire IDs were not found: ${notFoundUmpireIds.join(
            ", "
          )}`,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
    }

    // Validate players belong to their respective teams
    const homeTeamPlayers = validPlayers.filter(
      (player) =>
        player.teamId.toString() === homeTeamId &&
        homeTeamPlayingPlayer.includes(player._id.toString())
    );

    const awayTeamPlayers = validPlayers.filter(
      (player) =>
        player.teamId.toString() === awayTeamId &&
        awayTeamPlayingPlayer.includes(player._id.toString())
    );

    if (
      homeTeamPlayers.length !== homeTeamPlayingPlayer.length ||
      awayTeamPlayers.length !== awayTeamPlayingPlayer.length
    ) {
      return apiResponse({
        res,
        status: false,
        message: "Some players do not belong to their respective teams",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    let isQuickMatch;
    if (!tournamentId) {
      isQuickMatch = true;
    }

    const match = await CustomMatch.create({
      homeTeamId,
      awayTeamId,
      noOfOvers,
      overPerBowler,
      city,
      ground,
      dateTime,
      createdBy: userId,
      tournamentId,
      homeTeamPlayingPlayer,
      awayTeamPlayingPlayer,
      umpires,
      isQuickMatch,
      homeTeamScore: { runs: 0, overs: 0, wickets: 0 },
      awayTeamScore: { runs: 0, overs: 0, wickets: 0 },
    });

    return apiResponse({
      res,
      status: true,
      data: match,
      message: "Match created successfully!",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const listMatches = async (req, res) => {
  const authHeader = req.headers?.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  let userId;

  if (token) {
    try {
      const decodedToken = await helper.verifyToken(token);
      userId = decodedToken?.userId;
    } catch (error) {
      return apiResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        status: false,
        message: "Unauthorized access",
      });
    }
  }

  const { page = 1, size = 10, tournamentId, isQuickMatch } = req.query;

  try {
    let condition = {};

    if (userId) {
      condition.createdBy = userId;
    }

    if (tournamentId) {
      condition.tournamentId = tournamentId;
    }

    if (isQuickMatch !== undefined) {
      condition.isQuickMatch = isQuickMatch === "true";
    }

    const limit = parseInt(size);
    const skip = (parseInt(page) - 1) * limit;

    // Fetch matches with the applied condition
    const matches = await CustomMatch.find(condition)
      .skip(skip)
      .limit(limit)
      .populate({
        path: "homeTeamId",
        model: "CustomTeam",
        select: "teamName teamImage",
      })
      .populate({
        path: "awayTeamId",
        model: "CustomTeam",
        select: "teamName teamImage",
      })
      .populate({
        path: "city",
        model: "CustomCityList",
        select: "city",
      })
      .populate({
        path: "tournamentId",
        model: "CustomTournament",
        select: "name tournamentImage",
      })
      .populate({
        path: "umpires",
        model: "CustomMatchOfficial",
        select: "name",
      })
      .lean();

    const totalItems = await CustomMatch.countDocuments(condition);

    const formattedMatches = matches.map((match) => ({
      _id: match._id,
      isQuickMatch: match.isQuickMatch,
      noOfOvers: match.noOfOvers,
      overPerBowler: match.overPerBowler,
      ground: match.ground,
      dateTime: match.dateTime,
      homeTeam: match.homeTeamId
        ? {
            id: match.homeTeamId._id,
            name: match.homeTeamId.teamName,
            image: match.homeTeamId.teamImage,
          }
        : null,
      awayTeam: match.awayTeamId
        ? {
            id: match.awayTeamId._id,
            name: match.awayTeamId.teamName,
            image: match.awayTeamId.teamImage,
          }
        : null,
      city: match.city
        ? {
            id: match.city._id,
            name: match.city.city,
          }
        : null,
      tournament: match.tournamentId
        ? {
            id: match.tournamentId._id,
            name: match.tournamentId.name,
            image: match.tournamentId.tournamentImage,
          }
        : null,
      createdBy: match.createdBy,
      status: match.status,
      matchStatus: match.matchStatus ? match.matchStatus : null,
      matchResultNote: match.matchResultNote ? match.matchResultNote : null,
      umpires: match.umpires.map((umpire) => ({
        id: umpire._id,
        name: umpire.name,
      })),
      tossResult: match.tossResult,
      tossWinnerTeamId: match.tossWinnerTeamId,
      tossWinnerChoice: match.tossWinnerChoice,
    }));

    // Define the order of statuses
    const statusOrder = Object.values(config.matchStatusEnum);

    // Sort the matches based on status order
    formattedMatches.sort((a, b) => {
      return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
    });

    // Pagination data
    const getPagingData = (totalItems, matches, page, limit) => {
      const currentPage = page ? +page : 1;
      const totalPages = Math.ceil(totalItems / limit);
      return { totalItems, matches, totalPages, currentPage };
    };

    const response = getPagingData(totalItems, formattedMatches, page, limit);

    return apiResponse({
      res,
      status: true,
      data: response,
      message: "Matches fetched successfully!",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const updateMatch = async (req, res, next) => {
  try {
    const { id: matchId } = req.params;
    const {
      tournamentId,
      homeTeamId,
      awayTeamId,
      noOfOvers,
      overPerBowler,
      city,
      ground,
      dateTime,
      // homeTeamPlayingPlayer,
      // awayTeamPlayingPlayer,
      // umpires,
    } = req.body;

    const validation = validateObjectIds({
      matchId,
      homeTeamId,
      awayTeamId,
      city,
    });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const match = await CustomMatch.findById(matchId);
    const findCity = await CustomCityList.findById(city);
    const findHomeTeam = await CustomTeam.findById(homeTeamId);
    const findAwayTeam = await CustomTeam.findById(awayTeamId);

    if (tournamentId) {
      const tournament = await CustomTournament.findById(tournamentId);
      if (!tournament) {
        return apiResponse({
          res,
          status: true,
          message: "Tournament not found",
          statusCode: StatusCodes.NOT_FOUND,
        });
      }
    }
    if (!match) {
      return apiResponse({
        res,
        status: true,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    if (!findCity) {
      return apiResponse({
        res,
        status: true,
        message: "City not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    if (!findHomeTeam) {
      return apiResponse({
        res,
        status: true,
        message: "Home Team not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    if (!findAwayTeam) {
      return apiResponse({
        res,
        status: true,
        message: "Away Team not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // // Validate minimum 11 players for each team
    // if (
    //   !Array.isArray(homeTeamPlayingPlayer) ||
    //   homeTeamPlayingPlayer.length < 11 ||
    //   !Array.isArray(awayTeamPlayingPlayer) ||
    //   awayTeamPlayingPlayer.length < 11
    // ) {
    //   return apiResponse({
    //     res,
    //     status: false,
    //     message: "Both teams must have at least 11 players",
    //     statusCode: StatusCodes.BAD_REQUEST,
    //   });
    // }

    // // Validate umpire list
    // if (!Array.isArray(umpires) || umpires.length === 0) {
    //   return apiResponse({
    //     res,
    //     status: false,
    //     message: "Umpire list must be a non-empty array",
    //     statusCode: StatusCodes.BAD_REQUEST,
    //   });
    // }

    // // Check for duplicate players between teams
    // const duplicatePlayers = homeTeamPlayingPlayer.filter((player) =>
    //   awayTeamPlayingPlayer.includes(player)
    // );
    // if (duplicatePlayers.length > 0) {
    //   return apiResponse({
    //     res,
    //     status: false,
    //     message: "A player cannot be in both teams",
    //     statusCode: StatusCodes.BAD_REQUEST,
    //   });
    // }

    // // Check for duplicate umpires
    // const uniqueUmpires = new Set(umpires);
    // if (uniqueUmpires.size !== umpires.length) {
    //   return apiResponse({
    //     res,
    //     status: false,
    //     message: "Duplicate umpires are not allowed",
    //     statusCode: StatusCodes.BAD_REQUEST,
    //   });
    // }

    // // Validate all player IDs and umpire IDs
    // const allIds = [
    //   ...homeTeamPlayingPlayer,
    //   ...awayTeamPlayingPlayer,
    //   ...umpires,
    // ];

    // // Function to validate MongoDB ObjectId format
    // const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    // // Filter out invalid IDs
    // const invalidIds = allIds.filter((id) => !isValidObjectId(id));

    // if (invalidIds.length > 0) {
    //   return apiResponse({
    //     res,
    //     status: false,
    //     message: `The following IDs are invalid: ${invalidIds.join(", ")}`,
    //     statusCode: StatusCodes.BAD_REQUEST,
    //   });
    // }

    // // Validate players and umpires exist
    // const validEntities = await Promise.all([
    //   CustomPlayers.find({
    //     _id: { $in: [...homeTeamPlayingPlayer, ...awayTeamPlayingPlayer] },
    //   }),
    //   customUmpireList.find({ _id: { $in: umpires } }),
    // ]);

    // const [validPlayers, validUmpires] = validEntities;

    // if (
    //   validPlayers.length !==
    //   homeTeamPlayingPlayer.length + awayTeamPlayingPlayer.length
    // ) {
    //   const foundPlayerIds = validPlayers.map((player) =>
    //     player._id.toString()
    //   );
    //   const notFoundPlayerIds = [
    //     ...homeTeamPlayingPlayer,
    //     ...awayTeamPlayingPlayer,
    //   ].filter((id) => !foundPlayerIds.includes(id));
    //   return apiResponse({
    //     res,
    //     status: false,
    //     message: `The following player IDs were not found: ${notFoundPlayerIds.join(
    //       ", "
    //     )}`,
    //     statusCode: StatusCodes.BAD_REQUEST,
    //   });
    // }

    // if (validUmpires.length !== umpires.length) {
    //   const foundUmpireIds = validUmpires.map((umpire) =>
    //     umpire.umpireId.toString()
    //   );
    //   const notFoundUmpireIds = umpires.filter(
    //     (id) => !foundUmpireIds.includes(id)
    //   );
    //   return apiResponse({
    //     res,
    //     status: false,
    //     message: `The following umpire IDs were not found: ${notFoundUmpireIds.join(
    //       ", "
    //     )}`,
    //     statusCode: StatusCodes.BAD_REQUEST,
    //   });
    // }

    // // Validate players belong to their respective teams
    // const homeTeamPlayers = validPlayers.filter(
    //   (player) =>
    //     player.teamId.toString() === homeTeamId &&
    //     homeTeamPlayingPlayer.includes(player._id.toString())
    // );

    // const awayTeamPlayers = validPlayers.filter(
    //   (player) =>
    //     player.teamId.toString() === awayTeamId &&
    //     awayTeamPlayingPlayer.includes(player._id.toString())
    // );

    // if (
    //   homeTeamPlayers.length !== homeTeamPlayingPlayer.length ||
    //   awayTeamPlayers.length !== awayTeamPlayingPlayer.length
    // ) {
    //   return apiResponse({
    //     res,
    //     status: false,
    //     message: "Some players do not belong to their respective teams",
    //     statusCode: StatusCodes.BAD_REQUEST,
    //   });
    // }

    const updatedMatch = await CustomMatch.findByIdAndUpdate(
      matchId,
      {
        homeTeamId,
        awayTeamId,
        tournamentId,
        noOfOvers,
        overPerBowler,
        city,
        ground,
        dateTime,
        // homeTeamPlayingPlayer,
        // awayTeamPlayingPlayer,
      },
      { new: true }
    );

    return apiResponse({
      res,
      status: true,
      data: updatedMatch,
      message: "Match updated successfully!",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const deleteMatch = async (req, res) => {
  const { id: matchId } = req.params;
  const userId = req.user._id;

  const validation = validateObjectIds({ matchId });
  if (!validation.isValid) {
    return apiResponse({
      res,
      status: false,
      message: validation.message,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    const match = await CustomMatch.findById(matchId);

    if (!match) {
      return apiResponse({
        res,
        status: true,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Check if the user deleting the match is the same as the one who created it
    if (match.createdBy.toString() !== userId.toString()) {
      return apiResponse({
        res,
        status: false,
        message: "You are not authorized to delete this match",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    await CustomMatch.findByIdAndDelete(matchId);
    return apiResponse({
      res,
      status: true,
      message: "Match deleted successfully!",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const updateMatchStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingMatch = await CustomMatch.findById(id);
    if (!existingMatch) {
      return apiResponse({
        res,
        status: true,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Validate status transitions
    if (
      existingMatch.status === existingMatch.status &&
      status === enums.matchStatusEnum.not_started
    ) {
      return apiResponse({
        res,
        status: false,
        message: "Cannot update status for a not started match",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    } else if (existingMatch.status === enums.matchStatusEnum.finished) {
      return apiResponse({
        res,
        status: false,
        message: "Cannot update status for a finished match",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    } else if (existingMatch.status === enums.matchStatusEnum.cancelled) {
      return apiResponse({
        res,
        status: false,
        message: "Cannot update status for a cancelled match",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    } else {
      existingMatch.status = status;
    }

    const updatedMatch = await existingMatch.save();

    return apiResponse({
      res,
      status: true,
      data: updatedMatch,
      message: "Match updated successfully!",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const updateTossStatus = async (req, res) => {
  try {
    const { matchId, tournamentId, tossWinnerTeamId, tossWinnerChoice } =
      req.body;
    const userId = req.user._id;

    // Validate input
    const validation = validateObjectIds({
      matchId,
      tossWinnerTeamId,
    });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Find the match and check its status
    const match = await CustomMatch.findOne({ _id: matchId });
    if (!match) {
      return apiResponse({
        res,
        status: true,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Check tournament existence if tournamentId is provided
    if (tournamentId) {
      const tournament = await CustomMatch.findOne({ tournamentId });
      if (!tournament) {
        return apiResponse({
          res,
          status: true,
          message: "Tournament not found",
          statusCode: StatusCodes.NOT_FOUND,
        });
      }
    }

    if (match.createdBy.toString() !== userId.toString()) {
      return apiResponse({
        res,
        status: false,
        message:
          "You are not authorized to update the toss status for this match",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    // Check if the match status is in_progress
    if (match.status !== enums.matchStatusEnum.in_progress) {
      return apiResponse({
        res,
        status: false,
        message:
          "You cannot update toss status because the match is not in live",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Check if toss has already been conducted
    if (match.tossWinnerTeamId) {
      return apiResponse({
        res,
        status: false,
        message: "Toss has already been conducted for this match",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Find the winning team's name
    const winningTeam = await CustomTeam.findById(tossWinnerTeamId);
    if (!winningTeam) {
      return apiResponse({
        res,
        status: true,
        message: "Toss winner team not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const tossResult = `${winningTeam.teamName} won the toss and elected to ${tossWinnerChoice}`;

    // Construct the update object
    const updateData = {
      tossWinnerTeamId,
      tossWinnerChoice,
      tossResult,
    };

    if (tournamentId) {
      updateData.tournamentId = tournamentId;
    }

    // Find and update the match
    const updatedMatch = await CustomMatch.findOneAndUpdate(
      { _id: matchId },
      updateData,
      { new: true }
    );

    await createScorecards(updatedMatch, tournamentId);

    return apiResponse({
      res,
      status: true,
      data: updatedMatch,
      message: "Toss status updated successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const createScorecards = async (match, tournamentId) => {
  try {
    const createTeamScorecard = async (teamId, playerIds) => {
      const team = await CustomTeam.findById(teamId);
      const players = await CustomPlayers.find({ _id: { $in: playerIds } });

      return {
        id: teamId,
        name: team.teamName,
        players: players.map((player) => ({
          id: player._id,
          name: player.playerName,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          overs: 0,
          maidens: 0,
          wickets: 0,
          status: enums.matchScorecardStatusEnum.yet_to_bat,
          activeBowler: false,
          activeStriker: false,
          outType: null,
          wicketByFielder: null,
        })),
      };
    };

    const homeTeamScorecard = await createTeamScorecard(
      match.homeTeamId,
      match.homeTeamPlayingPlayer
    );
    const awayTeamScorecard = await createTeamScorecard(
      match.awayTeamId,
      match.awayTeamPlayingPlayer
    );
    const matchScorecard = new CustomMatchScorecard({
      matchId: match._id,
      scorecard: {
        homeTeam: homeTeamScorecard,
        awayTeam: awayTeamScorecard,
      },
    });

    if (tournamentId) {
      matchScorecard.tournamentId = tournamentId;
    }

    await matchScorecard.save();
  } catch (error) {
    console.error("Error in createScorecards:", error);
    throw error;
  }
};

const getMatchScorecard = async (req, res) => {
  try {
    const { matchId } = req.params;

    const scorecard = await CustomMatchScorecard.findOne({ matchId })
      .populate("tournamentId", "name")
      .populate("matchId", "dateTime");

    if (!scorecard) {
      return apiResponse({
        res,
        status: true,
        message: "Scorecard not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Fetch home and away team images
    const homeTeam = await CustomTeam.findById(
      scorecard.scorecard.homeTeam.id
    ).select("teamImage");
    const awayTeam = await CustomTeam.findById(
      scorecard.scorecard.awayTeam.id
    ).select("teamImage");

    // Convert Mongoose documents to plain JavaScript objects
    const scorecardObj = scorecard.toObject();
    const homeTeamObj = homeTeam ? homeTeam.toObject() : null;
    const awayTeamObj = awayTeam ? awayTeam.toObject() : null;

    return apiResponse({
      res,
      status: true,
      data: {
        tournamentId: scorecardObj.tournamentId._id,
        tournamentName: scorecardObj.tournamentId.name,
        matchId: scorecardObj.matchId._id,
        matchDateTime: scorecardObj.matchId.dateTime,
        scorecard: {
          homeTeam: {
            ...scorecardObj.scorecard.homeTeam,
            image: homeTeamObj ? homeTeamObj.teamImage : null,
          },
          awayTeam: {
            ...scorecardObj.scorecard.awayTeam,
            image: awayTeamObj ? awayTeamObj.teamImage : null,
          },
        },
      },
      message: "Scorecard retrieved successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    console.error(err);
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const updateStartingPlayerScorecard = async (req, res) => {
  try {
    const { matchId } = req.params;
    const {
      bowlingTeamId,
      battingTeamId,
      bowlerId,
      strikerId,
      nonStrikerId,
      // status,
    } = req.body;
    const userId = req.user._id;

    const validation = validateObjectIds({
      matchId,
      bowlingTeamId,
      battingTeamId,
      bowlerId,
      strikerId,
      nonStrikerId,
      // status
    });

    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const existingMatch = await CustomMatchScorecard.findOne({ matchId });
    if (!existingMatch) {
      return apiResponse({
        res,
        status: true,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Check if the user is authorized
    const match = await CustomMatch.findById(matchId);
    // console.log(match);
    if (match?.createdBy?.toString() != userId?.toString()) {
      return apiResponse({
        res,
        status: false,
        message: "You are not authorized to update the scorecard of this match",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    // Validate if the teams and players exist
    const entitiesToValidate = [
      { model: CustomTeam, id: bowlingTeamId, name: "Bowling team" },
      { model: CustomTeam, id: battingTeamId, name: "Batting team" },
      { model: CustomPlayers, id: bowlerId, name: "Bowler" },
      { model: CustomPlayers, id: strikerId, name: "Striker" },
      { model: CustomPlayers, id: nonStrikerId, name: "Non-striker" },
    ];

    const validationErrors = await validateEntitiesExistence(
      entitiesToValidate
    );

    if (validationErrors.length > 0) {
      return apiResponse({
        res,
        status: false,
        message: validationErrors.join(", "),
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    let data = [
      {
        matchId: matchId,
        teamId: bowlingTeamId,
        playerId: bowlerId,
        updateScore: {
          activeStriker: false,
          activeBowler: true,
          status: "yet_to_bat",
        },
      },
      {
        matchId: matchId,
        teamId: battingTeamId,
        playerId: strikerId,
        updateScore: {
          activeStriker: true,
          activeBowler: false,
          status: "not_out",
        },
      },
      {
        matchId: matchId,
        teamId: battingTeamId,
        playerId: nonStrikerId,
        updateScore: {
          activeStriker: false,
          activeBowler: false,
          status: "not_out",
        },
      },
    ];

    await Promise.all(data.map(updateMatchScorecardDetails));

    const updatedMatch = await CustomMatchScorecard.findOne({ matchId });

    return apiResponse({
      res,
      status: true,
      message: "Status updated successfully",
      statusCode: StatusCodes.OK,
      body: updatedMatch,
    });
  } catch (error) {
    console.error("Error in updateStartingPlayerScorecard:", error);
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const getMatchSummary = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Fetch the scorecard details using the matchId
    const scorecard = await CustomMatchScorecard.findOne({ matchId });
    const match = await CustomMatch.findById(matchId);

    if (!scorecard) {
      return apiResponse({
        res,
        status: false,
        message: "Scorecard not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if (!match) {
      return apiResponse({
        res,
        status: false,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Filter the players based on their status
    const battingTeamKey = scorecard.scorecard.homeTeam.players.some(
      (player) => player.status === "not_out"
    )
      ? "homeTeam"
      : "awayTeam";
    const bowlingTeamKey =
      battingTeamKey === "homeTeam" ? "awayTeam" : "homeTeam";

    const batters = scorecard.scorecard[battingTeamKey].players.filter(
      (player) => player.status === "not_out"
    );
    const bowlers = scorecard.scorecard[bowlingTeamKey].players.filter(
      (player) => player.activeBowler
    );

    // Function to get player image from the database
    const getPlayerImageFromDB = async (playerId) => {
      try {
        const player = await CustomPlayers.findById(playerId).select("image");
        return player?.image || "";
      } catch (error) {
        console.error(`Error fetching image for player ${playerId}:`, error);
        return "";
      }
    };

    const city = await CustomCityList.findById(match.city).select("city");

    // Fetch umpire names
    const umpires = await CustomMatchOfficial.find({
      _id: { $in: match.umpires },
    }).select("name");

    const responseData = {
      batters: await Promise.all(
        batters.map(async (player) => {
          const image = await getPlayerImageFromDB(player.id);
          return {
            name: player.name,
            runs: player.runs,
            balls: player.balls,
            fours: player.fours,
            sixes: player.sixes,
            id: player.id,
            image: image,
          };
        })
      ),
      bowlers: await Promise.all(
        bowlers.map(async (player) => {
          const image = await getPlayerImageFromDB(player.id);
          return {
            name: player.name,
            overs: player.overs,
            maidens: player.maidens,
            runs: player.runs,
            wickets: player.wickets,
            id: player.id,
            image: image,
          };
        })
      ),
      matchInfo: {
        location: city ? city.city : "",
        venue: match.ground,
        referee: umpires.map((umpire) => umpire.name).join(", "),
      },
    };
    return apiResponse({
      res,
      status: true,
      data: responseData,
      message: "Summary fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.error("Error fetching match summary:", error);
    return apiResponse({
      res,
      status: false,
      message: "Internal server error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getMatchSquads = async (req, res) => {
  try {
    const { id } = req.params;
    let filter = {};
    if (id) filter._id = new mongoose.Types.ObjectId(id);

    const match = await CustomMatch.find(filter)
      .populate({ path: "homeTeamId", select: "_id teamName teamImage" })
      .populate({ path: "awayTeamId", select: "_id teamName teamImage" })
      .populate({
        path: "homeTeamPlayingPlayer",
        select: "playerName role image",
        populate: {
          path: "role",
          select: "role",
        },
      })
      .populate({
        path: "awayTeamPlayingPlayer",
        select: "playerName role image",
        populate: {
          path: "role",
          select: "role",
        },
      })
      .select(
        "homeTeamId awayTeamId status homeTeamPlayingPlayer awayTeamPlayingPlayer"
      );

    return apiResponse({
      res,
      status: true,
      data: match[0],
      message: "Squads fetched successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.error("Error fetching match summary:", error);
    return apiResponse({
      res,
      status: false,
      message: "Internal server error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const setMatchStatus = async (req, res, next) => {
  try {
    const { matchId, statusId, description } = req.body;
    const userId = req.user._id;

    // Find the match
    const match = await CustomMatch.findById(matchId);
    if (!match) {
      return apiResponse({
        res,
        status: true,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Check if the user is the creator of the match
    if (match.createdBy.toString() !== userId.toString()) {
      return apiResponse({
        res,
        status: false,
        message: "You are not authorized to set the status of this match",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    // Find the status name from CustomMatchStatus
    const status = await CustomMatchStatus.findById(statusId);
    if (!status) {
      return apiResponse({
        res,
        status: true,
        message: "Status not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Validate description if status is "Others"
    if (status.status === "Others" && !description) {
      return apiResponse({
        res,
        status: false,
        message: "Description is required for 'Others' status",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Update the match status
    const matchStatusDes =
      status.status === "Others" ? description : status.status;
    match.matchStatus = matchStatusDes;
    await match.save();

    return apiResponse({
      res,
      status: true,
      message: "Match status updated successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const updateMatchResult = async (req, res, next) => {
  try {
    const { matchId, winnerTeamId, status, reason } = req.body;
    const userId = req.user._id;

    // Validate input
    const validation = validateObjectIds({ matchId, winnerTeamId });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Find the match
    const match = await CustomMatch.findById(matchId);
    if (!match) {
      return apiResponse({
        res,
        status: true,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Check if the user is the creator of the match
    if (match.createdBy.toString() !== userId.toString()) {
      return apiResponse({
        res,
        status: false,
        message: "You are not authorized to update the result of this match",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    // Fetch team names
    const homeTeam = await CustomTeam.findById(match.homeTeamId);
    const awayTeam = await CustomTeam.findById(match.awayTeamId);

    if (!homeTeam || !awayTeam) {
      return apiResponse({
        res,
        status: true,
        message: "One or both teams not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Determine the winner and calculate the margin
    let matchResultNote = "";
    if (winnerTeamId.toString() === match.homeTeamId.toString()) {
      if (match.awayTeamScore.wickets === 10) {
        const margin = match.homeTeamScore.runs - match.awayTeamScore.runs;
        matchResultNote = `${homeTeam.teamName} won by ${margin} runs`;
      } else {
        const margin = 10 - match.homeTeamScore.wickets;
        matchResultNote = `${homeTeam.teamName} won by ${margin} wickets`;
      }
    } else if (winnerTeamId.toString() === match.awayTeamId.toString()) {
      if (match.homeTeamScore.wickets === 10) {
        const margin = match.awayTeamScore.runs - match.homeTeamScore.runs;
        matchResultNote = `${awayTeam.teamName} won by ${margin} runs`;
      } else {
        const margin = 10 - match.awayTeamScore.wickets;
        matchResultNote = `${awayTeam.teamName} won by ${margin} wickets`;
      }
    }

    // Update match result
    if (status === enums.matchStatusEnum.finished) {
      match.status = enums.matchStatusEnum.finished;
      match.matchResultNote = matchResultNote;
    } else {
      if (!reason) {
        return apiResponse({
          res,
          status: false,
          message: "Reason is required for statuses other than 'finished'",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
      if (
        [
          enums.matchStatusEnum.in_progress,
          enums.matchStatusEnum.not_started,
          enums.matchStatusEnum.finished,
        ].includes(status)
      ) {
        return apiResponse({
          res,
          status: false,
          message: "Cannot set status to 'in_progress' or 'not_started'",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
      match.status = status;
      match.matchResultNote = reason;
    }

    await match.save();

    return apiResponse({
      res,
      status: true,
      message: "Match result updated successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

export default {
  createMatch,
  listMatches,
  updateMatch,
  deleteMatch,
  updateMatchStatus,
  updateTossStatus,
  createScorecards,
  getMatchScorecard,
  updateStartingPlayerScorecard,
  getMatchSummary,
  getMatchSquads,
  setMatchStatus,
  updateMatchResult,
};
