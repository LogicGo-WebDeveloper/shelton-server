import mongoose from "mongoose";

const CustomPlayerOversSchema = new mongoose.Schema({
  playerStandingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomPlayerStandings",
  },
  battingPlayerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomPlayers",
  },
  balls: { type: Number, required: false },
  runs: { type: Number, required: false },
  levels: { type: String, required: false },
  bowlerId: { type: String, required: false },
  wicketTypeId: { type: String, required: false },
  wicketTypeId: { type: String, required: false },
  overs_finished: { type: Boolean, required: false },
  noBall: { type: Boolean, required: false },
  whiteBall: { type: Boolean, required: false },
  lbBall: { type: Boolean, required: false },
  byeBall: { type: Boolean, required: false },
  isOut: { type: Boolean, required: false },
  oversNumber: { type: Number, required: false },
});

const CustomPlayerOvers = mongoose.model(
  "CustomPlayerOvers",
  CustomPlayerOversSchema
);

export default CustomPlayerOvers;
