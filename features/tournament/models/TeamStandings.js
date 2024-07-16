import mongoose from "mongoose";

const TeamSeasonStandingSchema = new mongoose.Schema(
  {
    tournamentId: { type: String, required: true },
    seasons: [
      {
        seasonId: { type: String, required: true },
        data: { type: Array, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const TeamSeasonStanding = mongoose.model(
  "TeamSeasonStanding",
  TeamSeasonStandingSchema
);

export default TeamSeasonStanding;
