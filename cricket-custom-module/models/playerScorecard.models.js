import mongoose from "mongoose";

const CustomPlayerScoreCardSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomMatch" },
  strikerPlayerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomPlayers",
  },
  nonStrikerPlayerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomPlayers",
  },
  score: { type: Number, required: false },
  totalScore: { type: Number, required: false },
  bowlerId: { type: String, required: false },
  six: { type: Number, required: false },
  four: { type: Number, required: false },
});

const CustomPlayerScoreCard = mongoose.model(
  "CustomPlayerScoreCard",
  CustomPlayerScoreCardSchema
);

export default CustomPlayerScoreCard;
