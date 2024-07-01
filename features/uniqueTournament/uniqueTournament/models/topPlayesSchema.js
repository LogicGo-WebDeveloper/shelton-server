import mongoose from 'mongoose';

const topPlayersSchema = new mongoose.Schema({
    tournamentId: { type: String, required: true },
    seasons: [{
      seasonId: { type: String, required: true },
      playerStatistics: { type: Array, required: true }
    }]
  });

const TopPlayers = mongoose.model('TopPlayers', topPlayersSchema);

export default TopPlayers;