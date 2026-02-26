import { Request, Response } from "express";
import User from "../models/User";
import { FrontendUser } from "../types/types";

const toFrontendUser = (user: any): FrontendUser => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
});

// REGISTER USER
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    res.status(201).json({ user: toFrontendUser(newUser) });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN USER
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ user: toFrontendUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};