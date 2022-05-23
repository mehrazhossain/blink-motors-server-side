const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// express middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`Server running on port ${port}`);
});

app.listen(port, () => {
  console.log(`Blink Motors app listening on port`, port);
});
