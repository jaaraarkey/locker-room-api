import pg from "pg";
import dotenv from "dotenv";

//const dotenv = dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  //   connectionString: process.env.DATABASE_URL,
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // For development purposes only. Should be true in production.     }
  },
});
export default pool;
