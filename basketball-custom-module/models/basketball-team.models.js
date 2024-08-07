import mongoose from "mongoose";

const customBasketballTeamSchema = new mongoose.Schema({
  teamName: String,
  city: String,
  teamImage: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomTournament" },
});

const CustomBasketballTeam = mongoose.model("CustomBasketballTeam", customBasketballTeamSchema);

export default CustomBasketballTeam;