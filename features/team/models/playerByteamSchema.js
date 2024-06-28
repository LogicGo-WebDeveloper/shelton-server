import mongoose from "mongoose";

const PlayerTeamSchema = new mongoose.Schema(
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

const PlayerTeam = mongoose.model("PlayerTeam", PlayerTeamSchema);

export default PlayerTeam;
