import mongoose from "mongoose";

const pregameFormSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PregameForm = mongoose.model("PregameForm", pregameFormSchema);

export default PregameForm;
