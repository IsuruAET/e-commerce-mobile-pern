1. Create web server using "node/express", and want to monitor changes by "nodemon" and This should run on port 5000. Use typescript.

2. Setup environment variables need for this. use "dotenv".
   API_URL=http://localhost:5000/api/v1
   PORT=5000

3. Use "morgan" for logging APIs.

4. Please connect "PostgreSQL" database to the server. add localhost postgreSQL connection string to .env file. Use Singleton pattern for DB Connection.
