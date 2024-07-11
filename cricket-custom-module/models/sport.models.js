import mongoose from "mongoose";

const customSportListSchema = new mongoose.Schema({
  sportId: String,
  sportName: String,
  image: String,
});

const CustomSportList = mongoose.model(
  "CustomSportList",
  customSportListSchema
);

export default CustomSportList;
