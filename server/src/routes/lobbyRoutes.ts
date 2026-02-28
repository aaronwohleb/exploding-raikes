import express from 'express';
import { createLobby, joinLobby, getLobbyDetails, updateReadyStatus, leaveLobby } from '../controllers/lobbyController';

const router = express.Router();

router.post('/', createLobby);
router.post('/join', joinLobby);
router.get('/:code', getLobbyDetails);
router.patch('/:code/players/:userId/ready', updateReadyStatus);
router.delete('/:code/players/:userId', leaveLobby);

export default router;