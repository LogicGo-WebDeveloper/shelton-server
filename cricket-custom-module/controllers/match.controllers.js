import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import CustomMatch from "../models/match.models.js";
import { validateObjectIds } from "../utils/utils.js";
import CustomTournament from "../models/tournament.models.js";
import { CustomCityList } from "../models/common.models.js";
import CustomTeam from "../models/team.models.js";
import helper from "../../helper/common.js";
import CustomPlayers from "../models/player.models.js";
import enums from "../../config/enum.js";
import config from "../../config/enum.js";

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
    } = req.body;
    const userId = req.user._id;

    const validation = validateObjectIds({
      homeTeamId,
      awayTeamId,
      tournamentId,
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

    const tournament = await CustomTournament.findById(tournamentId);
    const findCity = await CustomCityList.findById(city);
    const findHomeTeam = await CustomTeam.findById(homeTeamId);
    const findAwayTeam = await CustomTeam.findById(awayTeamId);

    if (!tournament) {
      return apiResponse({
        res,
        status: true,
        message: "Tournament not found",
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
    // Validate all player IDs exist and are valid ObjectIds
    const allPlayerIds = [...homeTeamPlayingPlayer, ...awayTeamPlayingPlayer];
    console.log("All player IDs:", allPlayerIds);

    // Function to validate MongoDB ObjectId format
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    // Filter out invalid IDs
    const invalidIds = allPlayerIds.filter((id) => !isValidObjectId(id));

    if (invalidIds.length > 0) {
      return apiResponse({
        res,
        status: false,
        message: `The following player IDs are invalid: ${invalidIds.join(
          ", "
        )}`,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const validPlayers = await CustomPlayers.find({
      _id: { $in: allPlayerIds },
    });
    console.log("Valid players found:", validPlayers.length);

    if (validPlayers.length !== allPlayerIds.length) {
      const foundPlayerIds = validPlayers.map((player) =>
        player._id.toString()
      );
      const notFoundPlayerIds = allPlayerIds.filter(
        (id) => !foundPlayerIds.includes(id)
      );
      return apiResponse({
        res,
        status: false,
        message: `The following player IDs were not found: ${notFoundPlayerIds.join(
          ", "
        )}`,
        statusCode: StatusCodes.BAD_REQUEST,
      });
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
      status,
    });

    return apiResponse({
      res,
      status: true,
      data: match,
      message: "Match created successfully!",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    console.error("Error in createMatch:", err);
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
  const token = authHeader ? authHeader?.split(" ")[1] : null;
  let userId;
  if (token) {
    const decodedToken = await helper.verifyToken(token);
    userId = decodedToken?.userId;
  }

  const { page = 1, size = 10 } = req.query;

  try {
    let condition = {};

    if (userId) {
      condition.createdBy = userId;
    }

    const limit = parseInt(size);
    const skip = (parseInt(page) - 1) * limit;

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
      .lean();

    const totalItems = await CustomMatch.countDocuments(condition);

    const formattedMatches = matches.map((match) => ({
      _id: match._id,
      noOfOvers: match.noOfOvers,
      overPerBowler: match.overPerBowler,
      ground: match.ground,
      dateTime: match.dateTime,
      homeTeam: match.homeTeamId ? {
        id: match.homeTeamId._id,
        name: match.homeTeamId.teamName,
        image: match.homeTeamId.teamImage,
      }: null,
      awayTeam: match.awayTeamId ? {
        id: match.awayTeamId._id,
        name: match.awayTeamId.teamName,
        image: match.awayTeamId.teamImage,
      }: null,
      city: match.city ? {
        id: match.city._id,
        name: match.city.city
      }: null,
      tournament: match.tournamentId ? {
        id: match.tournamentId._id,
        name: match.tournamentId.name,
        image: match.tournamentId.tournamentImage
      }: null,
      createdBy: match.createdBy,
      status: match.status
    }));

    // Define the order of statuses
    const statusOrder = Object.values(config.matchStatusEnum);

    // Sort the matches based on status order
    formattedMatches.sort((a, b) => {
      return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
    });
 

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
    console.log(err);
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
      homeTeamPlayingPlayer,
      awayTeamPlayingPlayer,
    } = req.body;

    const validation = validateObjectIds({
      matchId,
      homeTeamId,
      awayTeamId,
      tournamentId,
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
    const tournament = await CustomTournament.findById(tournamentId);
    const findCity = await CustomCityList.findById(city);
    const findHomeTeam = await CustomTeam.findById(homeTeamId);
    const findAwayTeam = await CustomTeam.findById(awayTeamId);
    if (!match) {
      return apiResponse({
        res,
        status: true,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    if (!tournament) {
      return apiResponse({
        res,
        status: true,
        message: "Tournament not found",
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

    // Validate all player IDs exist and are valid ObjectIds
    const allPlayerIds = [...homeTeamPlayingPlayer, ...awayTeamPlayingPlayer];
    console.log("All player IDs:", allPlayerIds);

    // Function to validate MongoDB ObjectId format
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    // Filter out invalid IDs
    const invalidIds = allPlayerIds.filter((id) => !isValidObjectId(id));

    if (invalidIds.length > 0) {
      return apiResponse({
        res,
        status: false,
        message: `The following player IDs are invalid: ${invalidIds.join(
          ", "
        )}`,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const validPlayers = await CustomPlayers.find({
      _id: { $in: allPlayerIds },
    });
    console.log("Valid players found:", validPlayers.length);

    if (validPlayers.length !== allPlayerIds.length) {
      const foundPlayerIds = validPlayers.map((player) =>
        player._id.toString()
      );
      const notFoundPlayerIds = allPlayerIds.filter(
        (id) => !foundPlayerIds.includes(id)
      );
      return apiResponse({
        res,
        status: false,
        message: `The following player IDs were not found: ${notFoundPlayerIds.join(
          ", "
        )}`,
        statusCode: StatusCodes.BAD_REQUEST,
      });
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
        homeTeamPlayingPlayer,
        awayTeamPlayingPlayer,
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
    console.error("Error in updateMatch:", err);
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
        status: false,
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
        status: false,
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
    console.log(error);
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
};
