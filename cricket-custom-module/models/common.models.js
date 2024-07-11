import mongoose from 'mongoose';

const customCityListSchema = new mongoose.Schema({
    city: String,
    id: String
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

const CustomCityList = mongoose.model('CustomCityList', customCityListSchema);
const CustomTournamentCategory = mongoose.model('CustomTournamentCategory', tournamentCategorySchema);
const CustomTournamentWinningPrize = mongoose.model('CustomTournamentWinningPrize', tournamentWinningPrizeSchema);
const CustomMatchType = mongoose.model('CustomMatchType', matchTypeSchema);
const CustomMatchOn = mongoose.model('CustomMatchOn', matchOnSchema);

export { CustomCityList, CustomTournamentCategory, CustomTournamentWinningPrize, CustomMatchType, CustomMatchOn };