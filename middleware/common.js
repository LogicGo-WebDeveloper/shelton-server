import fs from 'fs/promises';
import path from 'path';
import { CustomCityList, CustomTournamentCategory, CustomMatchType, CustomMatchOn, CustomTournamentWinningPrize } from "../cricket-custom-module/models/common.models.js";
import CustomSportList from "../cricket-custom-module/models/sport.models.js";

// Function to read JSON file
const readJsonFile = async (filePath) => {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
};

// Read JSON files
const cityList = await readJsonFile(path.resolve('json/cities.tournament.json'));
const sportList = await readJsonFile(path.resolve('json/sport-list.tournament.json'));
const categoryList = await readJsonFile(path.resolve('json/category.tournament.json'));
const matchTypeList = await readJsonFile(path.resolve('json/match-type.tournament.json'));
const matchOnList = await readJsonFile(path.resolve('json/match-on-tournament.json'));
const winningPrizeList = await readJsonFile(path.resolve('json/winning-prize.tournament.json'));

// ... existing code ...
export const InsertSportList = async() => {
    const sportNamesInJson = sportList.map(sport => sport.sportName);
    for (const sport of sportList) {
        const exists = await CustomSportList.findOne({ sportName: sport.sportName });
        if (!exists) {
            const newSport = new CustomSportList(sport);
            await newSport.save();
        } else {
            exists.image = sport.image;
            await exists.save();
        }
    }
    // Delete sports not in JSON
    await CustomSportList.deleteMany({ sportName: { $nin: sportNamesInJson } });
}

// ... existing code ...
export const InsertCityList = async() => {
    const cityNamesInJson = cityList.map(city => city.city);
    for (const city of cityList) {
        const exists = await CustomCityList.findOne({ city : city.city });
        if (!exists) {
            const newCity = new CustomCityList(city);
            await newCity.save();
        } 
    }
    // Delete cities not in JSON
    await CustomCityList.deleteMany({ city: { $nin: cityNamesInJson } });
}

// ... existing code ...
export const InsertTournamentCategory = async() => {
    const categoryNamesInJson = categoryList.map(category => category.name);
    for (const category of categoryList) {
        const exists = await CustomTournamentCategory.findOne({ name : category.name });
        if (!exists) {
            const newCategory = new CustomTournamentCategory(category);
            await newCategory.save();
        } 
    }
    // Delete categories not in JSON
    await CustomTournamentCategory.deleteMany({ name: { $nin: categoryNamesInJson } });
}

// ... existing code ...
export const InsertMatchType = async() => {
    const matchTypeNamesInJson = matchTypeList.map(matchType => matchType.name);
    for (const matchType of matchTypeList) {
        const exists = await CustomMatchType.findOne({ name : matchType.name });
        if (!exists) {
            const newMatchType = new CustomMatchType(matchType);
            await newMatchType.save();
        } 
    }
    // Delete match types not in JSON
    await CustomMatchType.deleteMany({ name: { $nin: matchTypeNamesInJson } });
}

// ... existing code ...
export const InsertMatchOn = async() => {
    const matchOnNamesInJson = matchOnList.map(matchOn => matchOn.name);
    for (const matchOn of matchOnList) {
        const exists = await CustomMatchOn.findOne({ name : matchOn.name });
        if (!exists) {
            const newMatchOn = new CustomMatchOn(matchOn);
            await newMatchOn.save();
        } 
    }
    // Delete match on not in JSON
    await CustomMatchOn.deleteMany({ name: { $nin: matchOnNamesInJson } });
}

// ... existing code ...
export const InsertTournamentWinningPrize = async() => {
    const winningPrizeNamesInJson = winningPrizeList.map(prize => prize.name);
    
    for (const winningPrize of winningPrizeList) {
        const exists = await CustomTournamentWinningPrize.findOne({ name: winningPrize.name });
        if (!exists) {
            const newWinningPrize = new CustomTournamentWinningPrize(winningPrize);
            await newWinningPrize.save();
        } 
    }
    // Delete winning prizes not in JSON
    await CustomTournamentWinningPrize.deleteMany({ name: { $nin: winningPrizeNamesInJson } });
}