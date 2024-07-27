import mongoose from "mongoose";
import CustomMatchScorecard from "../models/matchScorecard.models.js";

export const getHostUrl = (req, middlePath) => {
    return req.protocol + "://" + req.get("host") + "/images/" +`${middlePath}/`;
};

export const validateObjectIds = (ids) => {
  for (const [key, value] of Object.entries(ids)) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return { isValid: false, message: `Invalid ${key}` };
    }
  }
  return { isValid: true };
};

export const updateMatchScorecardDetails = async (request) => {
  try {
    const scorecard = await CustomMatchScorecard.findOne({
      matchId: request.matchId,
    });

    if (!scorecard) {
      console.error(`Scorecard not found for matchId: ${request.matchId}`);
      return;
    }

    let team =
      scorecard.scorecard.homeTeam.id.toString() === request.teamId
        ? "homeTeam"
        : "awayTeam";

    const playerIndex = scorecard.scorecard[team].players.findIndex(
      (player) => player.id.toString() === request.playerId
    );

    if (playerIndex === -1) {
      console.error(`Player not found for playerId: ${request.playerId}`);
      return;
    }

    Object.keys(request.updateScore).forEach((key) => {
      if (scorecard.scorecard[team].players[playerIndex]) {
        scorecard.scorecard[team].players[playerIndex][key] = request.updateScore[key];
      } else {
        console.error(`Player at index ${playerIndex} is undefined`);
      }
    });

    await scorecard.save();
  } catch (error) {
    console.error("Error in updateMatchScorecardDetails:", error);
  }
};
  