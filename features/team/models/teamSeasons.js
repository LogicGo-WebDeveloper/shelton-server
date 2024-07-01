import mongoose from "mongoose";

const teamSeasonsSchema = new mongoose.Schema({
  teamId: { type: String, required: true },
  data: {
    type: Array,
    required: true,
  },
});

const TeamSeasons = mongoose.model("teamSeasons", teamSeasonsSchema);

export default TeamSeasons;
