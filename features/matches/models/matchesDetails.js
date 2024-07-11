import mongoose from "mongoose";

const matchesScreenMatchesSchema = new mongoose.Schema(
  {
    customId: {
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

const MatchesScreenMatches = mongoose.model(
  "MatchesScreenMatches",
  matchesScreenMatchesSchema
);

export default MatchesScreenMatches;
