import mongoose from "mongoose";

const TeamSeasonsStandingSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
}, {
  timestamps: true,
});

const TeamSeasonsStanding = mongoose.model("TeamSeasonsStanding", TeamSeasonsStandingSchema);

export default TeamSeasonsStanding;