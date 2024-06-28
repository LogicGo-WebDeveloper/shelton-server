import mongoose from "mongoose";

const FeaturedMatchesSchema = new mongoose.Schema(
  {
    tournamentId: {
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

const FeaturedMatches = mongoose.model(
  "featuredMatches",
  FeaturedMatchesSchema
);

export default FeaturedMatches;
