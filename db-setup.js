import mysql from 'mysql2';

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'webuser',
    password: 'StrongPassword@123',
    database: 'mywebsite_db'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Create enquiries table
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dog_breed VARCHAR(255),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_message TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

db.execute(createTableQuery, (err, result) => {
    if (err) {
        console.error('Error creating table:', err);
        return;
    }
    console.log('Enquiries table created successfully');
    db.end();
});