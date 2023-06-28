const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");

const app = express();
app.use(bodyParser.json());

// Create MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "username",
  password: "password",
  database: "database_name",
});

// Add Customer API
app.post("/api/customers", (req, res) => {
  const { name, phoneNumber } = req.body;

  // Input params validation
  if (!name || !phoneNumber) {
    return res
      .status(400)
      .json({ error: "Name and phone number are required." });
  }

  // Check for duplicates
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error connecting to MySQL:", err);
      return res
        .status(500)
        .json({ error: "Failed to connect to the database." });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error("Error beginning transaction:", err);
        return res
          .status(500)
          .json({ error: "Failed to start the transaction." });
      }

      const query = "INSERT INTO customers (name, phone_number) VALUES (?, ?)";
      const values = [name, phoneNumber];

      connection.query(query, values, (err, result) => {
        if (err) {
          connection.rollback(() => {
            connection.release();
            console.error("Error executing query:", err);
            return res.status(500).json({ error: "Failed to add customer." });
          });
        } else {
          connection.commit((err) => {
            if (err) {
              connection.rollback(() => {
                connection.release();
                console.error("Error committing transaction:", err);
                return res
                  .status(500)
                  .json({ error: "Failed to commit the transaction." });
              });
            } else {
              connection.release();
              res.status(200).json({ message: "Customer added successfully." });
            }
          });
        }
      });
    });
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
