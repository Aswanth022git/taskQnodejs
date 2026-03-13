const sql = require("mssql");
require("dotenv").config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_DATABASE,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

let poolInstance = null;

const connectDB = async () => {
    try {
        if (poolInstance) {
            return poolInstance;
        }

        poolInstance = await sql.connect(dbConfig);
        console.log("Database pool connected");

        poolInstance.on("error", async (err) => {
            console.error("SQL pool error:", err.message);
            poolInstance = null;
        });

        return poolInstance;
    } catch (error) {
        console.error("Database connection failed:", error);
        poolInstance = null;
        throw error;
    }
};

module.exports = { sql, connectDB };