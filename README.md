# Exploding Kauffman
Web based multiplayer version of Exploding Kittens, built with the MERN stack.

# Deployment Guide
This document explains how to run the application locally using Docker. The system is fully containerized, so no manual dependency setup is required.

# 1. Clone the Repository
git clone https://github.com/aaronwohleb/exploding-raikes.git  
cd exploding-raikes  


# 2. Run the Application
Start everything (client + server) by using the following:
docker compose up --build  

Stop everything by using the following:
docker compose down  

# 3. Access the Application
Once running:
http://localhost:3000  