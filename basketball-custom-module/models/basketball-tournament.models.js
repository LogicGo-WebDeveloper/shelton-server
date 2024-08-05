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
  organiserEmail: String,
  tournamentStartDate: Date,
  tournamentEndDate: Date,
  tournamentCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomTournamentCategory",
  },
  tournamentBackgroundImage: String,
});

const CustomBasketballTournament = mongoose.model(
  "CustomBasketballTournament",
  customTournamentSchema
);

export default CustomBasketballTournament;
