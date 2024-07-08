import mongoose from "mongoose";

const matchOddsSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      required: true,
    },
    data: {
      type: Array,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const MatchOdds = mongoose.model("MatchOdds", matchOddsSchema);

export default MatchOdds;
