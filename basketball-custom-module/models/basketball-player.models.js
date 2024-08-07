import mongoose from "mongoose";

const customBasketballPlayersSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  jerseyNumber: { type: String, required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "CustomBasketballPlayerRole" },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomTeam" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  image: { type: String, required: false },
});

const CustomBasketballPlayers = mongoose.model("CustomBasketballPlayers", customBasketballPlayersSchema);

export default CustomBasketballPlayers;
