import mongoose from "mongoose";

const ScheduleMatchesSchema = new mongoose.Schema({
  sport: String,
  data: [{ 
    date: { type: Date, required: true }, 
    matches: { type: Array, required: true } 
  }],
});

const ScheduleMatches = mongoose.model("ScheduleMatches", ScheduleMatchesSchema);

export default ScheduleMatches;