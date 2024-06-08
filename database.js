import mysql from "mysql2"
import env from "dotenv"
env.config()

export const db = mysql.createPool({
    host:process.env.host,
    user: process.env.user,
    port:process.env.port,
    password: process.env.password,
    database: process.env.database,
    connectionLimit: 100,
})
