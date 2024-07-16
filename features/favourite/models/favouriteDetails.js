import mongoose from "mongoose";

const FavouriteDetailsSchema = new mongoose.Schema({
  matchesId: { type: String, required: true },
  userId: { type: String, required: true },
  status: { type: Boolean, required: true },
});

const FavouriteDetails = mongoose.model(
  "FavouriteDetails",
  FavouriteDetailsSchema
);

export default FavouriteDetails;
