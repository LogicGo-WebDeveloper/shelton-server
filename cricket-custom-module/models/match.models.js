import mongoose from "mongoose";
import enums from "../../config/enum.js";

const customMatchSchema = new mongoose.Schema({
  homeTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomTeam",
    required: true,
  },
  awayTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomTeam",
    required: true,
  },
  noOfOvers: { type: Number, required: true },
  overPerBowler: { type: Number, required: true },
  city: { type: String, required: true },
  ground: { type: String, required: true },
  dateTime: { type: Date, required: true },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomTournament",
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  homeTeamPlayingPlayer: [
    { type: mongoose.Schema.Types.ObjectId, ref: "CustomPlayers" },
  ],
  awayTeamPlayingPlayer: [
    { type: mongoose.Schema.Types.ObjectId, ref: "CustomPlayers" },
  ],
  status: {
    type: String,
    enum: Object.values(enums.matchStatusEnum),
    default: enums.matchStatusEnum.not_started,
  },
  umpires: [{ type: mongoose.Schema.Types.ObjectId, ref: "CustomUmpire" }],
  tossResult: { type: String, default: null },
  tossWinnerTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomTeam",
    default: null,
  },
  tossWinnerChoice: {
    type: String,
    enum: [...Object.values(enums.tossChoiceEnum), null],
    default: null,
  },
  homeTeamScore: {
    runs: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
  },
  awayTeamScore: {
    runs: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
  },
  matchStatus: { type: String, default: null },
  matchResultNote: { type: String, default: null },
  powerPlays: {
    ranges: { type: String },
    isActive: { type: Boolean, default: false },
  },
  endInnings: {
    isDeclared: { type: Boolean, default: false },
    isAllOut: { type: Boolean, default: false },
  },
});

const CustomMatch = mongoose.model("CustomMatch", customMatchSchema);

export default CustomMatch;
