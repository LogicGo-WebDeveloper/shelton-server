import mongoose from "mongoose";

const FavouriteDetailsSchema = new mongoose.Schema({
  matchesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MatcheDetailsByMatchScreen",
  },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: Boolean, required: true },
});

const FavouriteDetails = mongoose.model(
  "FavouriteDetails",
  FavouriteDetailsSchema
);

export default FavouriteDetails;
