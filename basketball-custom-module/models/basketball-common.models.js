import mongoose from "mongoose";

// Player role
const basketballPlayerRoleSchema = new mongoose.Schema({
  role: String,
  image: String,
});

const CustomBasketballPlayerRole = mongoose.model("CustomBasketballPlayerRole", basketballPlayerRoleSchema);
    
export {
  CustomBasketballPlayerRole,
};
