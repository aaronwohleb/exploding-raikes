import { Request, Response } from "express";
import BackendUser from "../types/BackendUser";
import { toFrontendUser } from "./authController";
 
// UPDATE USERNAME
export const updateUsername = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { username } = req.body;
 
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters." });
    }
 
    const user = await BackendUser.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
 
    user.username = username.trim();
    await user.save();
 
    // Return the full FrontendUser so the client can replace its state
    res.json(toFrontendUser(user));
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
};

// DELETE ACCOUNT
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
 
    const user = await BackendUser.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
 
    res.json({ message: "Account deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
};