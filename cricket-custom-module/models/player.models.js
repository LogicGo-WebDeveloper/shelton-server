import mongoose from "mongoose";

const customPlayersSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  jerseyNumber: { type: String, required: true },
  role: { type: String, required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomTeam" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const CustomPlayers = mongoose.model("CustomPlayers", customPlayersSchema);

export default CustomPlayers;