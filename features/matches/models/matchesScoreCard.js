import mongoose from "mongoose";

const MatchesScorecardSchema = new mongoose.Schema(
  {
    matchId: {
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

const MatchesScoreCard = mongoose.model("matchesCard", MatchesScorecardSchema);

export default MatchesScoreCard;
