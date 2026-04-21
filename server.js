const express = require('express');
const multer = require('multer');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.post('/hash', upload.single('certificate'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    res.json({ hash: '0x' + hash });
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));