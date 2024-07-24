import mongoose from "mongoose";

const customCityListSchema = new mongoose.Schema({
  city: String,
  id: String,
});

const tournamentCategorySchema = new mongoose.Schema({
  name: String,
});

const tournamentWinningPrizeSchema = new mongoose.Schema({
  name: String,
});

const matchTypeSchema = new mongoose.Schema({
  name: String,
});

const matchOnSchema = new mongoose.Schema({
  name: String,
});

const pitchTypeSchema = new mongoose.Schema({
  pitchType: String,
});

const ballTypeSchema = new mongoose.Schema({
  ballType: String,
});

const CustomCityList = mongoose.model("CustomCityList", customCityListSchema);
const CustomTournamentCategory = mongoose.model(
  "CustomTournamentCategory",
  tournamentCategorySchema
);
const CustomTournamentWinningPrize = mongoose.model(
  "CustomTournamentWinningPrize",
  tournamentWinningPrizeSchema
);
const playerRoleSchema = new mongoose.Schema({
  role: String,
});
const matchStatusSchema = new mongoose.Schema({
  status: String,
});

const matchOfficialSchema = new mongoose.Schema({
  name: String,
});

const CustomMatchOfficial = mongoose.model(
  "CustomMatchOfficial",
  matchOfficialSchema
);
const CustomMatchStatus = mongoose.model(
  "CustomMatchStatus",
  matchStatusSchema
);
const CustomPlayerRole = mongoose.model("CustomPlayerRole", playerRoleSchema);
const CustomMatchType = mongoose.model("CustomMatchType", matchTypeSchema);
const CustomMatchOn = mongoose.model("CustomMatchOn", matchOnSchema);
const CustomPitchType = mongoose.model("CustomPitchType", pitchTypeSchema);
const CustomBallType = mongoose.model("CustomBallType", ballTypeSchema);

export {
  CustomCityList,
  CustomTournamentCategory,
  CustomTournamentWinningPrize,
  CustomPlayerRole,
  CustomMatchType,
  CustomMatchOn,
  CustomPitchType,
  CustomBallType,
  CustomMatchStatus,
  CustomMatchOfficial,
};
