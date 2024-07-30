import mongoose from "mongoose";

const FavouriteDetailsSchema = new mongoose.Schema({
  matchesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MatcheDetailsByMatchScreen",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  type: { type: String, required: true },
  status: { type: Boolean, required: true },
});

const FavouriteDetails = mongoose.model(
  "FavouriteDetails",
  FavouriteDetailsSchema
);

export default FavouriteDetails;
