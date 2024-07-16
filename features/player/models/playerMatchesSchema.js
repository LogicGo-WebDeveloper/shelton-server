import mongoose from "mongoose";

const playerMatchesSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  matches: { type: Array, required: true },
  image: { type: String },
});

const PlayerMatches = mongoose.model("playerMatches", playerMatchesSchema);

export default PlayerMatches;
