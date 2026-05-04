# exploding-raikes
Web based multiplayer version of Exploding Kauffman, built with the MERN stack.
# Exploding Kauffmans - Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
  
## Environment Setup

### Server

Create a `.env` file in the `server/` directory with the following variables:

```
JWT_SECRET=your_jwt_key
MONGO_URI=your_mongodb_connection_string
PORT=3001
CLIENT_ORIGIN=client_url
```

### Client

Create a `.env` file in the `client/` directory with the following:

```
VITE_API_URL=server_url
VITE_WS_URL=socket_url
```

## Running with Docker

From the project root directory:

```bash
docker compose up --build
```

To stop the containers:

```bash
docker compose down
```
