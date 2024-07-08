import mongoose from "mongoose";

const matchDetailsSchema = new mongoose.Schema(
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

const MatcheDetailsByMatchScreen = mongoose.model(
  "MatcheDetailsByMatchScreen",
  matchDetailsSchema
);

export default MatcheDetailsByMatchScreen;
