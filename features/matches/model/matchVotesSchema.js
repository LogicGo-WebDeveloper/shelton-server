import mongoose from "mongoose";

const matchVotesSchema = new mongoose.Schema(
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

const MatchVotes = mongoose.model("MatchVotes", matchVotesSchema);

export default MatchVotes;
