import mongoose from "mongoose";

const leagueMatchesSchema = new mongoose.Schema({
  tournamentId: { type: String, required: true },
  seasons: [{ seasonId: String, data: Object }],
});

const LeagueMatches = mongoose.model("LeagueMatches", leagueMatchesSchema);

export default LeagueMatches;