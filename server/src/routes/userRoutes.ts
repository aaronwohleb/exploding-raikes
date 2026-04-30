import { Router } from "express";
import { deleteAccount, updateUsername } from "../controllers/userController";
 
const router = Router();
 
router.patch("/:userId", updateUsername);
router.delete("/:userId", deleteAccount);

 
export default router;
 