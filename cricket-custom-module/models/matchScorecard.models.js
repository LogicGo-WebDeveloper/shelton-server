import mongoose from "mongoose";
import enums from "../../config/enum.js";

const CustomPlayerScoreSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, ref: "CustomPlayers" },
  name: String,
  runs: { type: Number, default: 0 },
  balls: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  overs: { type: Number, default: 0 },
  maidens: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  status: {
    type: String,
    enum: Object.values(enums.matchScorecardStatusEnum),  
    default: enums.matchScorecardStatusEnum.yet_to_bat,
  },
});

const TeamScoreSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, ref: "CustomTeam" },
  name: String,
  players: [CustomPlayerScoreSchema],
});

const CustomMatchScorecardSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomTournament",
      required: true,
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomMatch",
      required: true,
    },
    scorecard: {
      homeTeam: TeamScoreSchema,
      awayTeam: TeamScoreSchema,
    },
  },
  { timestamps: true }
);

const CustomMatchScorecard = mongoose.model(
  "CustomMatchScorecard",
  CustomMatchScorecardSchema
);

export default CustomMatchScorecard;
