import mongoose from "mongoose";
import enums from "../../config/enum.js";

const mongooseSchema = new mongoose.Schema(
  {
    name: String,
    tournamentImage: String,
    backgroundImage: String,
    ground: String,
    organizerName: String,
    organizerEmail: String,
    startDate: Date,
    endDate: Date,
    description: String,
    winningPrizeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomTournamentWinningPrize",
    },
    sportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomSportList",
    },
    tournamentCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomTournamentCategory",
    },
    matchOnId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomMatchOn" },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomCityList" },
  },
  {
    timestamps: true,
  }
);

const FootballTournamentModel = mongoose.model(
  "footballTournament",
  mongooseSchema
);

export default FootballTournamentModel;
