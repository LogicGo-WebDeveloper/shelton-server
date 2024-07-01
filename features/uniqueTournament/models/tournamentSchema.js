import mongoose from 'mongoose';

const { Schema } = mongoose;

const TournamentSchema = new Schema({
  tournamentId: {
    type: String,
    required: true
  },
  data: {
    type: Array,
    required: true
  }
}, {
  timestamps: true
});

const Tournament = mongoose.model('Tournament', TournamentSchema);

export default Tournament;