import mongoose from "mongoose";

const customTournamentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
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
  tournamentCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomTournamentCategory",
  },
  tournamentMatchTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomMatchType",
  },
  officialsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomMatchOfficial",
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
