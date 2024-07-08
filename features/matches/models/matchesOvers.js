import mongoose from "mongoose";

const MatchesOversSchema = new mongoose.Schema(
  {
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
    data: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const MatchesOvers = mongoose.model("matchesOvers", MatchesOversSchema);

export default MatchesOvers;
