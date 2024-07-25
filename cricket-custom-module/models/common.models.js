import mongoose from "mongoose";

// Tournament category schema
const tournamentCategorySchema = new mongoose.Schema({
  name: String,
});

// Tournament Winning Prize
const tournamentWinningPrizeSchema = new mongoose.Schema({
  name: String,
});

// Match types
const matchTypeSchema = new mongoose.Schema({
  name: String,
});

// Match on
const matchOnSchema = new mongoose.Schema({
  name: String,
});

// Pitch Type
const pitchTypeSchema = new mongoose.Schema({
  pitchType: String,
});

// Ball Type
const ballTypeSchema = new mongoose.Schema({
  ballType: String,
});

// Player role
const playerRoleSchema = new mongoose.Schema({
  role: String,
  image: String,
});

// Match status
const matchStatusSchema = new mongoose.Schema({
  status: String,
});

// Match official schema
const matchOfficialSchema = new mongoose.Schema({
  name: String,
  image: String,
});

// City schema
const customCityListSchema = new mongoose.Schema({
  city: String,
  id: String,
});

// Custom Out reasons
const customOutReasonSchema = new mongoose.Schema({
  reason: String,
  icon: String,
});

const CustomPlayerRole = mongoose.model("CustomPlayerRole", playerRoleSchema);
const CustomMatchType = mongoose.model("CustomMatchType", matchTypeSchema);
const CustomMatchOn = mongoose.model("CustomMatchOn", matchOnSchema);
const CustomPitchType = mongoose.model("CustomPitchType", pitchTypeSchema);
const CustomBallType = mongoose.model("CustomBallType", ballTypeSchema);
const CustomCityList = mongoose.model("CustomCityList", customCityListSchema);
const CustomMatchOfficial = mongoose.model("CustomMatchOfficial",matchOfficialSchema);
const CustomMatchStatus = mongoose.model("CustomMatchStatus",matchStatusSchema);
const CustomTournamentWinningPrize = mongoose.model("CustomTournamentWinningPrize",tournamentWinningPrizeSchema);
const CustomTournamentCategory = mongoose.model("CustomTournamentCategory",tournamentCategorySchema);
const CustomOutReason = mongoose.model("CustomOutReason",customOutReasonSchema);

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
  CustomOutReason
};
