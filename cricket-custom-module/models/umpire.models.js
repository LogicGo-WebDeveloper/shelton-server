import mongoose from "mongoose";

const customUmpireListSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomTournament",
    required: true,
  },
  umpireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomMatchOfficial",
    required: true,
  },
});

const customUmpireList = mongoose.model("CustomUmpire", customUmpireListSchema);

export default customUmpireList;
