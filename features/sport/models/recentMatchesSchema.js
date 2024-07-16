import mongoose from 'mongoose';

const sportDataSchema = new mongoose.Schema({
  sport: String,
  data: [Object],
});

const recentMatchSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  data: [sportDataSchema],
});

const RecentMatch = mongoose.model('RecentMatch', recentMatchSchema);

export default RecentMatch;