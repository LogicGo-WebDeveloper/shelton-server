import mongoose from "mongoose";

const customTournamentSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomSportList",
  },
  tournamentImage: String,
  name: String,
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomCityList",
  },
  groundName: String,
  organiserName: String,
  tournamentStartDate: Date,
  tournamentEndDate: Date,
  tournamentCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomTournamentCategory",
  },
  tournamentMatchTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomMatchType",
  },
  moreTeams: Boolean,
  winningPrizeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomTournamentWinningPrize",
  },
  matchOnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomMatchOn",
  },
  description: String,
  tournamentBackgroundImage: String,
});

const CustomTournament = mongoose.model(
  "CustomTournament",
  customTournamentSchema
);

export default CustomTournament;
