const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json());

app.get('/', (req, res) => {
  res.send('RedHope is running')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jxyklbs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const contactCollection = client.db("RedHope").collection('contacts')
    const usersCollection = client.db("RedHope").collection('users')



    // Jwt Related Api
    app.post('/jwt', (req, res) => {
      const user = req.body
      const token = jwt.sign(user, ACCESS_TOKEN_KEY, { expiresIn: '2h' })
      res.send({ token })
    })

    // Contacts Related APi
    app.post('/contacts', async (req, res) => {
      const contact = req.body;
      const result = await contactCollection.insertOne(contact)
      res.send(result)
    })

    // Users Related Api
    app.post('/users', async (req, res) => {
      const user = req.body
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Red Hope is Running on ${port}`)
})