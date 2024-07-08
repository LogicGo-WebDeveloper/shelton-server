import mongoose from "mongoose";

const matchH2HSchema = new mongoose.Schema(
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

const MatchH2H = mongoose.model("MatchH2H", matchH2HSchema);

export default MatchH2H;
