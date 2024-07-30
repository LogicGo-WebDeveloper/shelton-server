import mongoose from "mongoose";

const favouriteLeagueDetailsSchema = new mongoose.Schema({
  leagueId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  type: { type: String, required: true },
  status: { type: Boolean, required: true },
});

const favouriteLeagueDetails = mongoose.model(
  "favouriteLeagueDetails",
  favouriteLeagueDetailsSchema
);

export default favouriteLeagueDetails;
