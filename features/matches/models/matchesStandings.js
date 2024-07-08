import mongoose from "mongoose";

const MatchesStandingSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: String,
      required: true,
    },
    seasonId: {
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

const MatchesStanding = mongoose.model(
  "matchesStandings",
  MatchesStandingSchema
);

export default MatchesStanding;
