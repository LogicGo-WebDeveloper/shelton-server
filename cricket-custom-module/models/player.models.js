import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { type: String, required: true },
});

const Player = mongoose.model("Player", playerSchema);

export default Player;