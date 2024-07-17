import mongoose from "mongoose";

const favouriteLeagueDetailsSchema = new mongoose.Schema({
  leagueId: { type: String, required: true },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: Boolean, required: true },
});

const favouriteLeagueDetails = mongoose.model(
  "favouriteLeagueDetails",
  favouriteLeagueDetailsSchema
);

export default favouriteLeagueDetails;
