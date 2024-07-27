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
import customUmpireList from "../models/umpire.models.js";
import CustomMatchScorecard from "../models/matchScorecard.models.js";

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
    console.log(typeof umpires);
    console.log(typeof homeTeamPlayingPlayer);
    console.log(typeof awayTeamPlayingPlayer);

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
      customUmpireList.find({ _id: { $in: umpires } }),
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
        umpire._id.toString()
      );
      const notFoundUmpireIds = umpires.filter(
        (id) => !foundUmpireIds.includes(id)
      );
      return apiResponse({
        res,
        status: false,
        message: `The following umpire IDs were not found: ${notFoundUmpireIds.join(
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
      umpires,
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

  const { page = 1, size = 10, tournamentId } = req.query;

  try {
    let condition = {};

    if (userId) {
      condition.createdBy = userId;
    }

    if (tournamentId) {
      condition.tournamentId = tournamentId;
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
      .lean();

    const totalItems = await CustomMatch.countDocuments(condition);

    const formattedMatches = matches.map((match) => ({
      _id: match._id,
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
      umpires: match.umpires,
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
      homeTeamPlayingPlayer,
      awayTeamPlayingPlayer,
      umpires,
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
      customUmpireList.find({ _id: { $in: umpires } }),
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
        umpire._id.toString()
      );
      const notFoundUmpireIds = umpires.filter(
        (id) => !foundUmpireIds.includes(id)
      );
      return apiResponse({
        res,
        status: false,
        message: `The following umpire IDs were not found: ${notFoundUmpireIds.join(
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

    // Validate input
    const validation = validateObjectIds({
      matchId,
      tournamentId,
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
    const match = await CustomMatch.findOne({
      _id: matchId,
      tournamentId: tournamentId,
    });
    if (!match) {
      return apiResponse({
        res,
        status: true,
        message: "Match not found",
        statusCode: StatusCodes.NOT_FOUND,
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
    const tournament = await CustomTournament.findById(tournamentId);
    if (!winningTeam) {
      return apiResponse({
        res,
        status: true,
        message: "Toss winner team not found",
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

    if (
      ![enums.tossChoiceEnum.BATTING, enums.tossChoiceEnum.FIELDING].includes(
        tossWinnerChoice
      )
    ) {
      return apiResponse({
        res,
        status: false,
        message: "Toss winner choice must be either 'batting' or 'fielding'",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const tossResult = `${winningTeam.teamName} won the toss and elected to ${tossWinnerChoice}`;

    // Find and update the match
    const updatedMatch = await CustomMatch.findOneAndUpdate(
      { _id: matchId, tournamentId: tournamentId },
      {
        tossWinnerTeamId: tossWinnerTeamId,
        tossWinnerChoice: tossWinnerChoice,
        tossResult: tossResult,
      },
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
          status: "yet_to_bat",
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
      tournamentId,
      matchId: match._id,
      scorecard: {
        homeTeam: homeTeamScorecard,
        awayTeam: awayTeamScorecard,
      },
    });

    console.log("Before saving scorecard:", matchScorecard);

    const savedScorecard = await matchScorecard.save();
    console.log("Scorecard saved successfully:", savedScorecard);
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

    return apiResponse({
      res,
      status: true,
      data: {
        tournamentId: scorecard.tournamentId._id,
        tournamentName: scorecard.tournamentId.name,
        matchId: scorecard.matchId._id,
        matchDateTime: scorecard.matchId.dateTime,
        scorecard: scorecard.scorecard,
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

const updateMatchScorecard = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { scorecard } = req.body;

    if (!scorecard || !scorecard.homeTeam || !scorecard.awayTeam) {
      return apiResponse({
        res,
        status: false,
        message: "Invalid scorecard data",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const updatedScorecard = await CustomMatchScorecard.findOneAndUpdate(
      { matchId },
      { scorecard },
      { new: true }
    );

    if (!updatedScorecard) {
      return apiResponse({
        res,
        status: true,
        message: "Scorecard not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    return apiResponse({
      res,
      status: true,
      data: updatedScorecard,
      message: "Scorecard updated successfully",
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

export default {
  createMatch,
  listMatches,
  updateMatch,
  deleteMatch,
  updateMatchStatus,
  updateTossStatus,
  createScorecards,
  getMatchScorecard,
  updateMatchScorecard,
};
