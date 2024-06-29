import mongoose from "mongoose";

const teamTopPlayersSchema = new mongoose.Schema({
  tournamentId: { type: String, required: true },
  teamId: { type: String, required: true },
  seasonId: { type: String, required: true },
  type: { type: String, required: true },

  seasons: [
    {
      seasonId: { type: String, required: true },
      playerStatistics: { type: Array, required: true },
    },
  ],
});

const TeamTopPlayers = mongoose.model("teamTopPlayers", teamTopPlayersSchema);

export default TeamTopPlayers;
