import mongoose from "mongoose";

const customMatchSchema = new mongoose.Schema({
  homeTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  awayTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  noOfOvers: { type: Number, required: true },
  overPerBowler: { type: Number, required: true },
  city: { type: String, required: true },
  ground: { type: String, required: true },
  dateTime: { type: Date, required: true },
  pitchType: { type: String, required: true },
  ballType: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const CustomMatch = mongoose.model("CustomMatch", customMatchSchema);

export default CustomMatch;