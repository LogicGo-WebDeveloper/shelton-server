import mongoose from "mongoose";

const FavouriteTeamDetailsSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "TeamDetails" },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: Boolean, required: true },
});

const FavouriteTeamDetails = mongoose.model(
  "FavouriteTeamDetails",
  FavouriteTeamDetailsSchema
);

export default FavouriteTeamDetails;
