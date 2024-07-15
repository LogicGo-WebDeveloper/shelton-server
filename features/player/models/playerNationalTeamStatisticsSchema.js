import mongoose from "mongoose";

const playerNationalTeamStatisticsSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  data: { type: Object, required: true },
});

const PlayerNationalTeamStatistics = mongoose.model("PlayerNationalTeamStatistics", playerNationalTeamStatisticsSchema);

export default PlayerNationalTeamStatistics;