import mongoose from "mongoose";

const PlayerDetailsSchema = new mongoose.Schema({
  PlayerId: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  data: { type: Array, required: true },
});

const PlayerDetails = mongoose.model("PlayerDetails", PlayerDetailsSchema);

export default PlayerDetails;
