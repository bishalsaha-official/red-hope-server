const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const donationRequestCollection = client.db("RedHope").collection('donation-request')


    // Middleware
    const verifyToken = (req, res, next) => {
      console.log('inside token', req.headers.authorization)
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden access" })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, decode) => {
        if (err) {
          return res.status(401).send({ message: "forbidden access" })
        }
        req.decode = decode
        next()
      })
    }

    // Jwt Related Api----------------------------------------------------------------------
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: '2h' })
      res.send({ token })
    })

    // Contacts Related APi -----------------------------------------------------------------
    app.post('/contacts', async (req, res) => {
      const contact = req.body;
      const result = await contactCollection.insertOne(contact)
      res.send(result)
    })

    // Users Related Api ---------------------------------------------------------------------
    app.post('/users', async (req, res) => {
      const user = req.body
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })

    // Get All users
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    // Get Specific User
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email
      const query = { email: email }
      const result = await usersCollection.findOne(query)
      res.send(result)
    })

    // Update user information
    app.patch('/users/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedData = req.body;
      console.log(updatedData)

      const updateDoc = {
        $set: {
          name: updatedData.name,
          image: updatedData.image,
          bloodGroup: updatedData.bloodGroup,
          district: updatedData.district,
          upazila: updatedData.upazila
        }
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Donation Related Api--------------------------------------------------------
    // Get All Donation Request Api
    app.get('/donation-request/all', async (req, res) => {
      const result = await donationRequestCollection.find().toArray()
      res.send(result)
    })

    // Get Donation Requests (filter by email or status)
    app.get('/donation-request', async (req, res) => {
      const { email, status } = req.query;
      const query = {};

      if (email) {
        query.requesterEmail = email;
      }
      if (status) {
        query.status = status;
      }

      const result = await donationRequestCollection.find(query).toArray();
      res.send(result);
    });

    // Get Donation Request Data (last 3 recent posted)
    app.get('/donation-request/recent', async (req, res) => {
      const email = req.query.email
      const query = { requesterEmail: email }
      const result = await donationRequestCollection.find(query).sort({ donationDate: -1, donationTime: -1 }).limit(3).toArray()
      res.send(result)
    })

    // Post Donation Request
    app.post('/donation-request', async (req, res) => {
      const donation = req.body
      const result = await donationRequestCollection.insertOne(donation)
      res.send(result)
    })


    // Admin Related Api-------------------------------------------------------------------
    // Admin Stats
    app.get('/admin-stats', async (req, res) => {
      const users = await usersCollection.estimatedDocumentCount()
      const donationRequest = await donationRequestCollection.estimatedDocumentCount()
      res.send({ users, donationRequest })
    })

    // Blog Related Dashboard-------------------------------------------------------------------



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