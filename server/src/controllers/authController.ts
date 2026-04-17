import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import BackendUser from "../types/BackendUser";
import { FrontendUser } from "../types/types";


// CHANGE THIS TO AN ENV VARIABLE IN PRODUCTION !!!
const JWT_SECRET =  "super_cool_key";

/**
 * Converts a backend User object to a frontend User object by selecting only necessary fields
 * 
 * @param backendUser Backend User object to convert
 * @returns FrontendUser object with only necessary fields for the client
 */
export const toFrontendUser = (backendUser: any): FrontendUser => ({
  _id: backendUser._id.toString(),
  username: backendUser.username,
  email: backendUser.email,
  stats: {
    gamesPlayed: backendUser.stats?.gamesPlayed ?? 0,
    wins: backendUser.stats?.wins ?? 0,
    timesExploded: backendUser.stats?.timesExploded ?? 0,
  },
});

// REGISTER USER
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await BackendUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new BackendUser({ username, email, password: hashedPassword });
    await newUser.save();

    // Generate a JWT token that expires in 1 day
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "1d" });
    const frontendUser = toFrontendUser(newUser);
  
    res.status(201).json({ frontendUser, token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN USER
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existingUser = await BackendUser.findOne({ email });
    if (!existingUser) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the hashed password in the DB
    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token that expires in 1 day
    const token = jwt.sign({ id: existingUser._id }, JWT_SECRET, { expiresIn: "1d" });

    // Convert the backend user to a frontend user before sending the response
    const frontendUser = toFrontendUser(existingUser);
    res.json({ frontendUser, token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};