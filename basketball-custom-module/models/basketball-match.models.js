import mongoose from "mongoose";

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
    homeTeamPlayers: [
      {
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomBasketballPlayers", required: true },
        isPlaying: { type: Boolean, required: true },
      },
    ],
    awayTeamPlayers: [
      {
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomBasketballPlayers", required: true },
        isPlaying: { type: Boolean, required: true },
      },
    ],
    status: { type: String, enum: ["not_started", "in_progress", "finished"], default: "not_started" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const CustomBasketballMatch = mongoose.model("CustomBasketballMatch", customBasketballMatchSchema);

export default CustomBasketballMatch;