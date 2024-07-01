import mongoose from "mongoose";

const seasonSchema = new mongoose.Schema({
  tournamentId: {
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

const Season = mongoose.model("Season", seasonSchema);

export default Season;