import mysql from "mysql2/promise";
// import dotenv from "dotenv";


// dotenv.config();


// const dbHost = process.env.DB_HOST;
// const dbUser = process.env.DB_USER;
// const dbPassword = process.env.DB_PASSWORD;
// const dbName = process.env.DB_NAME;
// const dbPort = process.env.DB_PORT || 4700

const dbHost = "localhost";
const dbUser = "root";
const dbPassword = "0028";
const dbName = "project";
const dbPort = 4700



if (!dbHost || !dbUser || !dbPassword || !dbName) {
  throw new Error(
    "Missing MySQL database credentials. Please check your .env file."
  );
}


export const dbConnect = await mysql.createConnection({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  // port: dbPort, 
  // waitForConnections: true,
  // connectionLimit: 10,
  // queueLimit: 0,

 
});
