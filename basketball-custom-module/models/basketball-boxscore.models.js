import mongoose from "mongoose";

const playerStatsSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomBasketballPlayers", required: true },
  name: { type: String, required: true },
  image: { type: String, required: false },
  role: { type: String, required: true },
  jerseyNumber: { type: Number, required: true },
  isPlaying: { type: Boolean, required: true },
  points: { type: Number, default: 0 },
  rebounds: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  fouls: { type: Number, default: 0 },
  turnovers: { type: Number, default: 0 },
  freeThrowsAttempted: { type: Number, default: 0 },
  freeThrowsMade: { type: Number, default: 0 },
}, { _id: false });

const teamBoxScoreSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomBasketballTeam", required: true },
  teamName: { type: String, required: true },
  image: { type: String, required: true },
  players: [playerStatsSchema],
}, { _id: false });

const customBasketballBoxScoreSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomBasketballMatch", required: true },
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomBasketballTournament", default: null },
  tournamentName: { type: String, required: false },
  boxScore: {
    homeTeam: teamBoxScoreSchema,
    awayTeam: teamBoxScoreSchema
  }
}, { timestamps: true });

const CustomBasketballBoxScore = mongoose.model("CustomBasketballBoxScore", customBasketballBoxScoreSchema);
    
export { CustomBasketballBoxScore };
