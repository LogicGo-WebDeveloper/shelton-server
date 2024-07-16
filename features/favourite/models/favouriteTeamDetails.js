import mongoose from "mongoose";

const FavouriteTeamDetailsSchema = new mongoose.Schema({
  teamId: { type: String, required: true },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: Boolean, required: true },
});

const FavouriteTeamDetails = mongoose.model(
  "FavouriteTeamDetails",
  FavouriteTeamDetailsSchema
);

export default FavouriteTeamDetails;
