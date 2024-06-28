import mongoose from "mongoose";

const teamDetailsSchema = new mongoose.Schema(
  {
    teamId: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TeamDetails = mongoose.model("TeamDetails", teamDetailsSchema);

export default TeamDetails;
