import mongoose from "mongoose";

const countryLeagueListSchema = new mongoose.Schema({
  sport: { type: String, required: true, unique: true },
  data: { type: Array, required: true, image: { type: String } },
});

const CountryLeagueList = mongoose.model(
  "CountryLeagueList",
  countryLeagueListSchema
);

export default CountryLeagueList;
