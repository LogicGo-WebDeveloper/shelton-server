import mongoose from "mongoose";

const CustomPlayerOversSchema = new mongoose.Schema(
  {
    // playerScoreCardId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "CustomPlayerScoreCard",
    // },
    // matchId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "CustomMatch",
    //   required: true,
    // },
    // battingPlayerId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "CustomPlayers",
    // },
    // bowlerId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "CustomPlayers",
    // },
    // homeTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    // awayTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    // balls: { type: Number, required: true },
    // runs: { type: Number, required: true },
    // overs_finished: { type: Boolean, default: false },
    // noBall: { type: Number, default: 0 },
    // whiteBall: { type: Number, default: 0 },
    // lbBall: { type: Number, default: 0 },
    // byeBall: { type: Number, default: 0 },
    // isOut: { type: Boolean, default: false },
    // oversNumber: { type: Number, default: 0 },

    matchId: {
      type: String,
      required: true,
    },
    homeTeamId: {
      type: String,
      required: true,
    },
    awayTeamId: {
      type: String,
      required: true,
    },
    bowlerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomPlayers",
    },
    currentOvers: { type: Number, default: 1 },
    totalBalls: { type: Number, default: 1 },

    data: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CustomPlayerOvers = mongoose.model(
  "CustomPlayerOvers",
  CustomPlayerOversSchema
);

export default CustomPlayerOvers;
