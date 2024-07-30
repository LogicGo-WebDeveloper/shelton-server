import mongoose from "mongoose";

const customPlayersSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  jerseyNumber: { type: String, required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "CustomPlayerRole" },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomTeam" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  image: { type: String, required: false },
});

const CustomPlayers = mongoose.model("CustomPlayers", customPlayersSchema);

export default CustomPlayers;
