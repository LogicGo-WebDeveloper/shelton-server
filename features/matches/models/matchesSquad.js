import mongoose from "mongoose";

const MatchesSquadSchema = new mongoose.Schema(
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

const MatchesSquad = mongoose.model("matchesSquad", MatchesSquadSchema);

export default MatchesSquad;
