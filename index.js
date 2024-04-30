import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
// import dotenv from "dotenv";
import cors from "cors";
import pool from "./db.js";

const app = express();

dotenv.config();

app.use(cors());

app.use(express.json());

// const pool = new Pool({
//   // ssl: process.env.DATABASE_URL ? true : false,
// });
// const a = pool.query("select * from users");
// console.log(a);

app.get("/", async (req, res) => {
  res.send("hhelloo from online");
});

app.get("/test", async (req, res) => {
  const q = await pool.query("SELECT * from users");
  console.log(pool.query);
  res.send(q);
});

app.post("/api/auth/register", async (req, res) => {
  const { email, nickname, password } = req.body;

  if (!email || !password || !nickname)
    return res.status(400).send({ error: "Invalid request" });

  try {
    const encryptedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (email, password, nickname) VALUES ($1, $2, $3)",
      [email, encryptedPassword, nickname]
    );

    return res.send({ info: "User succesfully created" });
  } catch (err) {
    console.log(err);

    return res.status(500).send({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).send({ error: "Invalid request" });

  try {
    const q = await pool.query(
      "SELECT password, id, nickname from users WHERE email=$1",
      [email]
    );
    if (q.rowCount === 0) {
      return res.status(404).send({ error: "This user does not exist" });
    }

    const result = q.rows[0];
    console.log(result);
    const match = await bcrypt.compare(password, result.password);

    if (!match) {
      return res.status(403).send({ error: "Wrong password" });
    }
    try {
      const token = await JWT.sign(
        { id: result.id, nickname: result.nickname, email },
        process.env.JWT_SECRET,
        {
          algorithm: "HS512",
          expiresIn: "1h",
        }
      );
      console.log(token);
      return res.send({ token });
    } catch (err) {
      console.log(err);
      return res.status(500).send({ error: "Cannot generate token" });
    }
  } catch (error) {
    console.error(error);
  }
});

app.use(async (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).send("Unauthorized");

  try {
    const decoded = await JWT.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );

    if (decoded !== undefined) {
      req.user = decoded;
      return next();
    }
  } catch (err) {
    console.log(err);
  }

  return res.status(403).send("Invalid token");
});

app.post("/api/messages/new", async (req, res) => {
  // res.send({content: req.body.content, user_id: req.user.id, msg_time: Date.now()})
  const { content } = req.body;

  pool.query(
    "INSERT INTO messages (content, user_id) VALUES ($1, $2)",
    [content, req.user.id],
    (error, results) => {
      if (error) {
        res.json({ err: error });
      } else {
        res.json({ msg: "message has been sent" });
      }
    }
  );
});

app.get("/api/messages", async (req, res) => {
  const messages = await pool.query("SELECT * FROM messages");
  res.send(messages.rows);
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});

// psql --host=cfs632mn9c82a7.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com --port=5432 --username=u8dot7dncu8cg1 --password --dbname=d3kesgd7g95at6

// ? CREATING table users
/* 
CREATE TABLE users (
id SERIAL PRIMARY KEY,
nickname VARCHAR(50) UNIQUE NOT NULL,
email VARCHAR(100) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL
); 
*/

// ? CREATING TABLE messages
/* 
CREATE TABLE messages (
  id_pk SERIAL PRIMARY KEY,
  lobby_id_fkey INTEGER NOT NULL REFERENCES lobbies(id),
  messages_user_id_fkey INTEGER NOT NULL REFERENCES users(id),
  message_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 */

// ? To see the database schema ->
//  \dt

// ? To see the constrains ->
// \d+ -table name-
