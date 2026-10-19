import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// In production, require the real database credentials.
if (isProduction) {
  const requiredEnv = ["DB_HOST", "DB_USER", "DB_PASS", "DB_NAME", "DB_SSL_CA"];

  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(", ")}`,
    );
  }
}

// Database connection pool
export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "evangadi_forum",

  ...(process.env.DB_SSL_CA
    ? {
        ssl: {
          ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n"),
          rejectUnauthorized: true,
        },
      }
    : {}),

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const ensureParams = (params) => {
  if (params === undefined || params === null) {
    throw new Error("SQL parameters are required");
  }

  const isArray = Array.isArray(params);
  const isObject = !isArray && typeof params === "object";

  if (!isArray && !isObject) {
    throw new Error("SQL parameters must be an array or object");
  }
};

export const safeExecute = async (sql, params) => {
  if (typeof sql !== "string" || sql.trim().length === 0) {
    throw new Error("SQL query must be a non-empty string");
  }

  ensureParams(params);

  const [result] = await db.execute(sql, params);
  return result;
};
