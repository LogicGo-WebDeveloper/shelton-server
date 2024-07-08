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

const matchesScreenMatches = mongoose.model(
  "matchesScreenMatches",
  matchesScreenMatchesSchema
);

export default matchesScreenMatches;
