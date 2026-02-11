const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// API Endpoint for Enquiry Submission
app.post('/api/enquiry', (req, res) => {
    const { dogBreed, custName, custPhone, custMessage } = req.body;

    // Validate required fields
    if (!custName || !custPhone || !custMessage) {
        return res.status(400).json({ error: 'Name, phone, and message are required' });
    }

    // Insert into database
    const query = 'INSERT INTO enquiries (dog_breed, customer_name, customer_phone, customer_message) VALUES (?, ?, ?, ?)';
    db.execute(query, [dogBreed, custName, custPhone, custMessage], (err, result) => {
        if (err) {
            console.error('Error inserting enquiry:', err);
            return res.status(500).json({ error: 'Failed to save enquiry' });
        }
        console.log('Enquiry saved successfully');
        res.status(200).json({ message: 'Enquiry submitted successfully' });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});