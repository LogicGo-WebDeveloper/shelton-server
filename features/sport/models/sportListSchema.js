import mongoose from "mongoose";

const SportListSchema = new mongoose.Schema({
  data: {
    type: Object,
    required: true,
  },
  timezoneOffset: {
    type: String,
    required: true,
  },
});

const SportList = mongoose.model("SportList", SportListSchema);

export default SportList;
