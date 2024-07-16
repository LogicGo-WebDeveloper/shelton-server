import mongoose from "mongoose";

const FavouritePlayerDetailsSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: Boolean, required: true },
});

const FavouritePlayerDetails = mongoose.model(
  "FavouritePlayerDetails",
  FavouritePlayerDetailsSchema
);

export default FavouritePlayerDetails;
