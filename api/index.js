const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Stock Analysis API is running' });
});

// Add a test route
app.get('/test', (req, res) => {
  res.json({ message: 'API test endpoint working' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 