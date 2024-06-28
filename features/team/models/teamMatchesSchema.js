import mongoose from "mongoose";

const teamMatchesSchema = new mongoose.Schema({
  teamId: { type: String, required: true },
  matches: { type: Array, required: true },
});

const TeamMatches = mongoose.model("TeamMatches", teamMatchesSchema);

export default TeamMatches;