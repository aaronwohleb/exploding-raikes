# Integration Guide - Adding to Your Existing Repo

## Current Repo Structure (What You Have)
```
exploding-raikes/
├── client/          # Your React frontend
├── server/          # Your Node.js backend
├── docker-compose.yml
├── package.json
└── README.md
```

## What to Add from My Setup

### Step 1: Update Your docker-compose.yml

Replace your current `docker-compose.yml` with this updated version:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: gameuser
      POSTGRES_PASSWORD: gamepass
      POSTGRES_DB: exploding_kittens
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Backend Server
  server:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgres://gameuser:gamepass@db:5432/exploding_kittens
      PORT: 3001
    depends_on:
      - db
    volumes:
      - ./server:/app
      - /app/node_modules

  # Frontend React App
  client:
    build: ./client
    ports:
      - "3000:3000"
    environment:
      REACT_APP_BACKEND_URL: http://localhost:3001
    depends_on:
      - server
    volumes:
      - ./client:/app
      - /app/node_modules

volumes:
  postgres_data:
```

### Step 2: Add Dockerfiles

**Create `server/Dockerfile`:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
```

**Create `client/Dockerfile`:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 3: Update server/package.json

Add these dependencies if you don't have them:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "pg": "^8.11.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

### Step 4: Update client/package.json

Add these dependencies if you don't have them:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "socket.io-client": "^4.6.1",
    "axios": "^1.4.0"
  }
}
```

### Step 5: Create Game Logic Structure

Create this folder structure in your `server/` directory:

```
server/
├── server.js           # Main Express + Socket.io server
├── game-logic/         # Create this folder
│   ├── game.js        # Core game rules
│   ├── deck.js        # Deck management
│   └── cards.js       # Card effects
├── database.js        # Database connection
├── Dockerfile
└── package.json
```

### Step 6: Copy Key Files

From my setup, copy these files to your repo:

**Copy to root:**
- `.gitignore`
- `QUICKSTART.md`
- `TEAM_MEETING.md`
- `VISUAL_GUIDE.md`

**Copy to `server/game-logic/`:**
- `game.js` (I created this with deck creation and basic game logic)

**Copy to `client/src/`:**
- The lobby system components from my `App.js` if yours doesn't have it yet

### Step 7: What Your server.js Should Look Like

Here's the minimal server.js with Socket.io and lobby system:

```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage
const games = new Map();
const playerSockets = new Map();

// Generate game code
function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// REST API
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

app.post('/api/game/create', (req, res) => {
  const { playerName } = req.body;
  const gameCode = generateGameCode();
  
  games.set(gameCode, {
    code: gameCode,
    host: playerName,
    players: [{ name: playerName, isHost: true }],
    status: 'waiting',
    createdAt: new Date()
  });
  
  res.json({ gameCode, message: 'Game created' });
});

app.post('/api/game/join', (req, res) => {
  const { gameCode, playerName } = req.body;
  const game = games.get(gameCode);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (game.status !== 'waiting') {
    return res.status(400).json({ error: 'Game already started' });
  }
  
  if (game.players.some(p => p.name === playerName)) {
    return res.status(400).json({ error: 'Name already taken' });
  }
  
  game.players.push({ name: playerName, isHost: false });
  io.to(gameCode).emit('playerJoined', {
    playerName,
    players: game.players
  });
  
  res.json({ message: 'Joined successfully', players: game.players });
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('joinGameRoom', ({ gameCode, playerName }) => {
    socket.join(gameCode);
    playerSockets.set(socket.id, { gameCode, playerName });
    
    socket.to(gameCode).emit('playerConnected', {
      playerName,
      message: `${playerName} connected`
    });
  });
  
  socket.on('disconnect', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      const { gameCode, playerName } = playerInfo;
      socket.to(gameCode).emit('playerDisconnected', {
        playerName,
        message: `${playerName} disconnected`
      });
      playerSockets.delete(socket.id);
    }
  });
  
  socket.on('chatMessage', ({ gameCode, playerName, message }) => {
    io.to(gameCode).emit('chatMessage', {
      playerName,
      message,
      timestamp: new Date()
    });
  });
  
  socket.on('startGame', ({ gameCode }) => {
    const game = games.get(gameCode);
    if (game) {
      game.status = 'playing';
      io.to(gameCode).emit('gameStarted', {
        message: 'Game is starting!',
        players: game.players
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Testing Your Setup

### 1. Start Everything
```bash
# Make sure Docker Desktop is running
docker-compose down
docker-compose up --build
```

Wait for these messages:
- `server_1  | Server running on port 3001`
- `client_1  | webpack compiled successfully`

### 2. Test in Browser
1. Go to http://localhost:3000
2. Create a game
3. Open new tab/incognito
4. Join with the code
5. Test chat
6. Test start game

## Common Issues

**"Cannot find module 'socket.io'"**
```bash
docker-compose down
docker-compose up --build
```

**Port already in use**
```bash
# Find what's using the port
lsof -i :3000  # or :3001

# Kill it or change port in docker-compose.yml
```

**Changes not showing**
- Frontend: Hard refresh (Ctrl+Shift+R)
- Backend: Should auto-reload with nodemon
- If not, restart: `docker-compose restart server`

## What You Get

✅ Full multiplayer lobby system
✅ Game code joining (like Among Us)
✅ Real-time Socket.io
✅ Docker setup
✅ Database ready
✅ Game logic starter

## Next Steps

1. **Test the lobby** - Make sure create/join works
2. **Integrate your existing code** - Move any logic you already have
3. **Start building game features** - Use the game-logic folder
4. **Assign tasks** - Use TEAM_MEETING.md

## File Priority (What to Add First)

**Priority 1 - Must Have:**
1. Update `docker-compose.yml`
2. Add `server/Dockerfile`
3. Add `client/Dockerfile`
4. Update `server/package.json` with socket.io
5. Copy my `server.js` or merge with yours

**Priority 2 - Should Have:**
1. Copy `server/game-logic/game.js`
2. Copy lobby UI components to `client/src/`
3. Update `client/package.json` with socket.io-client

**Priority 3 - Nice to Have:**
1. Copy documentation files (QUICKSTART.md, etc.)
2. Update README with new instructions
3. Add .gitignore updates

## Git Workflow

```bash
# Create a branch for this integration
git checkout -b feature/docker-socket-lobby

# Make changes, test locally
docker-compose up --build

# Once working, commit
git add .
git commit -m "Add Docker setup and Socket.io lobby system"
git push origin feature/docker-socket-lobby

# Create PR, get review, merge
```

## Questions?

- Check logs: `docker-compose logs -f server`
- View my full examples in the downloaded files
- Ask your team in chat!
