import mongoose from "mongoose";

const FavouritePlayerDetailsSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: "PlayerDetails" },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  type: { type: String, required: true },
  status: { type: Boolean, required: true },
});

const FavouritePlayerDetails = mongoose.model(
  "FavouritePlayerDetails",
  FavouritePlayerDetailsSchema
);

export default FavouritePlayerDetails;
