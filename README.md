# Order Microservice

## Dev
1. Clone the repository:
   ```bash
   git clone git@github.com:Nest-Microservices-courseK/orders-microservice.git
   ```
2. ```bash
   cd orders-microservice
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create `.env` file based on `.env.example`
5. Run prisma migrations:
   ```bash
   npx prisma migrate dev
   ```
6. Run docker compose:
   ```bash
   docker compose up -d
   ```
6. Run the project:
   ```bash
   npm run start:dev
   ```
