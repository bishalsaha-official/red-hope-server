const express = require('express')
require('dotenv').config()
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json());

app.get('/', (req, res) => {
  res.send('RedHope is running')
})

app.listen(port, () => {
  console.log(`Red Hope is Running on ${port}`)
})