import mongoose from "mongoose";

const customTeamSchema = new mongoose.Schema({
  teamName: String,
  city: String,
  addMySelfInTeam: Boolean,
  teamImage: String,
});

const CustomTeam = mongoose.model("CustomTeam", customTeamSchema);

export default CustomTeam;