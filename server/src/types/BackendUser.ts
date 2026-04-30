import mongoose from "mongoose";

/**
 * Defines the User schema for a backend User to be stored in MongoDB.
 */
const BackendUserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    timesExploded: { type: Number, default: 0 },
  },

});

export default mongoose.model("BackendUser", BackendUserSchema);