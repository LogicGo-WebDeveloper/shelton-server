import mongoose from 'mongoose';

const seasonStandingSchema = new mongoose.Schema({
  tournamentId: { type: String, required: true },
  seasons: [{
    seasonId: { type: String, required: true },
    data: { type: Array, required: true }
  }]
}, {
  timestamps: true
});

const SeasonStanding = mongoose.model('SeasonStanding', seasonStandingSchema);

export default SeasonStanding;