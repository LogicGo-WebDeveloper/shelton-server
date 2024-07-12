import mongoose from "mongoose";

const customTournamentSchema = new mongoose.Schema({
  sportId: String,
  tournamentImage: String,
  name: String,
  cityId: String,
  groundName: String,
  organiserName: String,
  tournamentStartDate: Date,
  tournamentEndDate: Date,
  tournamentCategoryId: String,
  tournamentMatchTypeId: String,
  officials: Boolean,
  moreTeams: Boolean,
  winningPrizeId: String,
  matchOnId: String,
  description: String,
  tournamentBackgroundImage: String,
});

const CustomTournament = mongoose.model(
  "CustomTournament",
  customTournamentSchema
);

export default CustomTournament;
