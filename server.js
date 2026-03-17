const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 9192;

const buildPath = path.join(__dirname, 'dist', 'shikshagraha-dashboard', 'browser');

app.use(express.static(buildPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});