const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const app = express();
const port = 3001;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'f3a9c2b7e4d6a1f0b8c3d2e7a9c1b4f0';

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

    // First, save to Excel so enquiries are stored even if DB is unavailable
    saveEnquiryToExcel({ dogBreed, custName, custPhone, custMessage })
        .then(() => console.log('Enquiry appended to Excel'))
        .catch(err => console.error('Failed to append enquiry to Excel:', err));

    // Insert into database (best-effort). Respond success to client regardless of DB state.
    const query = 'INSERT INTO enquiries (dog_breed, customer_name, customer_phone, customer_message) VALUES (?, ?, ?, ?)';
    db.execute(query, [dogBreed, custName, custPhone, custMessage], (err, result) => {
        if (err) {
            console.error('Error inserting enquiry:', err);
            // Do NOT fail the client response; Excel holds the record
            return res.status(200).json({ message: 'Enquiry submitted (saved to Excel). Database unavailable.' });
        }
        console.log('Enquiry saved successfully');
        return res.status(200).json({ message: 'Enquiry submitted successfully' });
    });
});

async function saveEnquiryToExcel({ dogBreed, custName, custPhone, custMessage }) {
    try {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const excelPath = path.join(dataDir, 'enquiries.xlsx');
        const workbook = new ExcelJS.Workbook();

        const fileExists = fs.existsSync(excelPath);
        if (fileExists) {
            await workbook.xlsx.readFile(excelPath);
        }

        let sheet = workbook.getWorksheet('Enquiries');
        if (!sheet) {
            sheet = workbook.addWorksheet('Enquiries');
        }

        // If worksheet is new or has no columns, set header columns
        if (!fileExists || !sheet.columns || sheet.columns.length === 0) {
            sheet.columns = [
                { header: 'Timestamp', key: 'timestamp', width: 25 },
                { header: 'Dog Breed', key: 'breed', width: 20 },
                { header: 'Customer Name', key: 'name', width: 25 },
                { header: 'Phone', key: 'phone', width: 18 },
                { header: 'Message', key: 'message', width: 60 }
            ];
        }

        sheet.addRow({
            timestamp: new Date().toISOString(),
            breed: dogBreed || '',
            name: custName || '',
            phone: custPhone || '',
            message: custMessage || ''
        });

        await workbook.xlsx.writeFile(excelPath);
    } catch (err) {
        console.error('Error saving enquiry to Excel:', err);
        throw err;
    }
}

// Protected endpoint to download the enquiries Excel file
app.get('/admin/download-enquiries', (req, res) => {
    const token = req.get('x-admin-token') || req.query.token;
    if (!token || token !== ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const excelPath = path.join(__dirname, 'data', 'enquiries.xlsx');
    if (!fs.existsSync(excelPath)) {
        return res.status(404).json({ error: 'Enquiries file not found' });
    }

    res.download(excelPath, 'enquiries.xlsx', (err) => {
        if (err) console.error('Error sending enquiries file:', err);
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
