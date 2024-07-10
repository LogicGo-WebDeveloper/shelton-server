import CustomSportList from "../cricket-custom-module/models/sport.models.js";
import sportList from "../helper/sportList.json" assert { type: "json" };

export const InsertSportList = async() => {
    const sportNamesInJson = sportList.map(sport => sport.sportName);

    // Insert new sports
    for (const sport of sportList) {
        const exists = await CustomSportList.findOne({ sportName: sport.sportName });
        if (!exists) {
            const newSport = new CustomSportList(sport);
            await newSport.save();
        } else {
            // Update the existing sport with the new data
            exists.image = sport.image;
            await exists.save();
        }
    }

    // Delete sports not in JSON
    await CustomSportList.deleteMany({ sportName: { $nin: sportNamesInJson } });
}