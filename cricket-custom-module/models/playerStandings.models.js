import mongoose from "mongoose";

const CustomPlayerStandingsSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomMatch" },
  battingPlayerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomPlayers",
  },
  score: { type: Number, required: false },
  totalScore: { type: Number, required: false },
  bowlerId: { type: String, required: false },
  six: { type: Number, required: false },
  four: { type: Number, required: false },
});

const CustomPlayerStandings = mongoose.model(
  "CustomPlayerStandings",
  CustomPlayerStandingsSchema
);

export default CustomPlayerStandings;
