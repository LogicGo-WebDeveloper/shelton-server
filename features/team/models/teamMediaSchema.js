import mongoose from "mongoose";

const teamMediaSchema = new mongoose.Schema(
  {
    teamId: {
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

const teamMedia = mongoose.model("TeamMedia", teamMediaSchema);

export default teamMedia;
