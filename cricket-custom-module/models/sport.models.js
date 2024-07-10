import mongoose from 'mongoose';

const customSportListSchema = new mongoose.Schema({
    sportId: String,
    sportName: String,
});

const CustomSportList = mongoose.model('CustomSportList', customSportListSchema);

export default CustomSportList;