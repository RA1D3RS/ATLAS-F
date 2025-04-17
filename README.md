# Atlas-f: Moroccan Crowdfunding Platform

A crowdfunding platform for equity and donation-based projects in Morocco, compliant with Law 15-18 and no Riba principles.

## Setup Instructions
1. Clone the repository: `git clone https://github.com/RA1D3RS/Atlas-f.git`
2. Set up environment variables: Copy `.env.example` to `.env` and fill in values.
3. Run with Docker: `docker-compose up --build`

## Project Structure
- `mobile/`: React Native application
- `frontend/`: React application (TypeScript)
- `backend/`: Node.js/Express API
- `database/`: SQL scripts for PostgreSQL
- `docker-compose.yml`: Docker configuration