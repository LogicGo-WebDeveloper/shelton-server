import mongoose from "mongoose";

const TeamFeaturedMatchesSchema = new mongoose.Schema(
  {
    teamId: {
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

const TeamFeaturedMatches = mongoose.model(
  "TeamFeaturedMatches",
  TeamFeaturedMatchesSchema
);

export default TeamFeaturedMatches;
