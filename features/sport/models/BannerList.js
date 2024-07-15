import mongoose from "mongoose";

const BannerListSchema = new mongoose.Schema({
  bannerImage: { type: String, required: true },
});

const BannerSportList = mongoose.model("BannerList", BannerListSchema);

export default BannerSportList;
