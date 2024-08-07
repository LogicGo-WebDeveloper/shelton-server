import mongoose from "mongoose";
import CustomMatchScorecard from "../models/matchScorecard.models.js";
import CustomMatch from "../models/match.models.js";

export const getHostUrl = (req, middlePath) => {
  return req.protocol + "://" + req.get("host") + "/images/" + `${middlePath}/`;
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
  // console.log(request.playerId);
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

    // const matches = await CustomMatch.updateOne({ matchId: request.matchId });

    // const result = await CustomMatch.updateOne(
    //   { matchId: request.matchId }, // Query to find the document
    //   {
    //     $set: {
    //       "striker.name": strikerData.name,
    //       "striker.runs": strikerData.runs,
    //       "striker.ballsFaced": strikerData.ballsFaced,
    //       "nonStriker.name": nonStrikerData.name,
    //       "nonStriker.runs": nonStrikerData.runs,
    //       "nonStriker.ballsFaced": nonStrikerData.ballsFaced,
    //     },
    //   } // Fields to update
    // );

    const playerIndex = scorecard.scorecard[team].players.findIndex(
      (player) => player.id.toString() === request.playerId
    );

    if (playerIndex === -1) {
      console.error(`Player not found for playerId: ${request.playerId}`);
      return;
    }

    // console.log(111);

    Object.keys(request.updateScore).forEach((key) => {
      if (scorecard.scorecard[team].players[playerIndex]) {
        scorecard.scorecard[team].players[playerIndex][key] =
          request.updateScore[key];
      } else {
        console.error(`Player at index ${playerIndex} is undefined`);
      }
    });

    await scorecard.save();
  } catch (error) {
    console.error("Error in updateMatchScorecardDetails:", error);
  }
};

export const validateEntitiesExistence = async (entities) => {
  const results = await Promise.all(
    entities.map(async ({ model, id, name }) => {
      const entity = await model.findById(id);
      return entity ? null : `${name} with ID ${id} not found`;
    })
  );
  return results.filter((result) => result !== null);
};
