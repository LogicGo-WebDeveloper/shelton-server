import mongoose from "mongoose";

const customTeamSchema = new mongoose.Schema({
  teamName: String,
  city: String,
  teamImage: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomTournament" },
});

const CustomTeam = mongoose.model("CustomTeam", customTeamSchema);

export default CustomTeam;