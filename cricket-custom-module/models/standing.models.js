import mongoose from "mongoose";

const customStatndingSchema = new mongoose.Schema({
  homeTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  awayTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  whiteBall: { type: Number, required: true },
  undo: { type: Number, required: true },
  runOut: { type: String, required: true },
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
});

const CustomStanding = mongoose.model("CustomStanding", customStatndingSchema);

export default CustomStanding;
