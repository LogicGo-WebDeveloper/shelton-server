import mongoose from "mongoose";

const customPlayersSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { type: String, required: true },
});

const CustomPlayers = mongoose.model("CustomPlayers", customPlayersSchema);

export default CustomPlayers;