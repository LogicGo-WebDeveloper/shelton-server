import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema({
  current: { type: Number, default: 0 },
  period1: { type: Number, default: 0 },
  period2: { type: Number, default: 0 },
  period3: { type: Number, default: 0 },
  period4: { type: Number, default: 0 },
  normaltime: { type: Number, default: 0 },
  lastPointFieldGoal: { type: Boolean, default: false },
}, { _id: false });

const playerSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomBasketballPlayers", required: true },
  isPlaying: { type: Boolean, required: true },
}, { _id: false });

const customBasketballMatchSchema = new mongoose.Schema(
  {
    homeTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomBasketballTeam", required: true },
    awayTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomBasketballTeam", required: true },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomBasketballTournament", required: false },
    period: { type: Number, required: true },
    eachLasting: { type: Number, required: true },
    location: { type: String, required: true },
    gameContractor: { type: String, required: true },
    dateTime: { type: Date, required: true },
    homeTeamPlayers: [playerSchema],
    awayTeamPlayers: [playerSchema],
    homeTeamScore: { type: scoreSchema, default: () => ({}) },
    awayTeamScore: { type: scoreSchema, default: () => ({}) },
    status: { type: String, enum: ["not_started", "in_progress", "finished", "abandoned", "draw"], required: true },
    matchResultNote: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const CustomBasketballMatch = mongoose.model("CustomBasketballMatch", customBasketballMatchSchema);

export default CustomBasketballMatch;