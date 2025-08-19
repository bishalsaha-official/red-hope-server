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
    const blogsCollection = client.db("RedHope").collection('blogs')


    // Middleware-------------------------------------------------------------------
    // Verify Token
    const verifyToken = (req, res, next) => {
      console.log('inside token', req.headers.authorization)
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden access" })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "forbidden access" })
        }
        req.decoded = decoded
        next()
      })
    }

    // Verify Admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      const isAdmin = user?.role === 'admin'
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" })
      }
      next()
    }

    // Verify Volunteer
    const verifyVolunter = async (req, res, next) => {
      const email = req.decoded.email
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      const isVolunteer = user?.role === 'volunteer'
      if (!isVolunteer) {
        return res.status(403).send({ message: "forbidden access" })
      }
      next()
    }

    // Jwt Related Api----------------------------------------------------------------------
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1h' })
      res.send({ token })
    })

    // Contacts Related APi -----------------------------------------------------------------
    app.post('/contacts', async (req, res) => {
      const contact = req.body;
      const result = await contactCollection.insertOne(contact)
      res.send(result)
    })

    // Users Related Api ---------------------------------------------------------------------

    // Get All users
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
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

    // Check User Admin Or Not
    app.get('/users/check-admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      if (email !== req.decoded.email) {
        res.status(403).send({ message: "unauthorized access" })
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      let admin = false
      if (user) {
        admin = user?.role === "admin"
      }
      res.send({ admin })
    })

    // Check User Volunteer Or Not
    app.get('/users/check-volunteer/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      if (email !== req.decoded.email) {
        res.status(403).send({ message: "unauthorized access" })
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      let volunteer = false
      if (user) {
        volunteer = user?.role === "volunteer"
      }
      res.send({ volunteer })
    })

    // Post User
    app.post('/users', async (req, res) => {
      const user = req.body
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })

    // Update user information
    app.patch('/users/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedData = req.body;

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

    // Make Admin Api 
    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const updateRole = req.body
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: updateRole.role
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // Make Volunteer Api 
    app.patch('/users/volunteer/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const updateRole = req.body
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: updateRole.role
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // Make Block User Api
    app.patch('/users/block/:id', async (req, res) => {
      const id = req.params.id
      const updateRole = req.body
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: updateRole.status
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // Make Un Block User Api
    app.patch('/users/unblock/:id', async (req, res) => {
      const id = req.params.id
      const updateRole = req.body
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: updateRole.status
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // Delete User Api
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

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

    // Get Donation Details Api
    app.get('/donation-request/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await donationRequestCollection.findOne(query)
      res.send(result)
    })

    // Update Donation Request Status (pending to inprogress)
    app.patch('/donation-request/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updateStatus = req.body

      const updateDoc = {
        $set: {
          status: updateStatus.status
        }
      }
      const result = await donationRequestCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

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

    // Update donation status inprogress to done
    app.patch('/donation-request/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updateStatus = req.body
      const updateDoc = {
        $set: {
          status: updateStatus.status
        }
      }
      const result = await donationRequestCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // Delete Donation request from all donation routes
    app.delete('/donation-request/all/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const result = await donationRequestCollection.deleteOne(filter)
      res.send(result)
    })


    // Admin Related Api-------------------------------------------------------------------
    // Admin Stats
    app.get('/admin-stats', async (req, res) => {
      const users = await usersCollection.estimatedDocumentCount()
      const donationRequest = await donationRequestCollection.estimatedDocumentCount()
      res.send({ users, donationRequest })
    })

    // Blog Related Api-------------------------------------------------------------------
    // Get Blog
    app.get('/blogs', async (req, res) => {
      const result = await blogsCollection.find().toArray()
      res.send(result)
    })

    // Get Blog (published blog)
    app.get('/blogs/publish', async (req, res) => {
      const filter = req.query.status
      const query = { status: filter }
      const result = await blogsCollection.find(query).toArray()
      res.send(result)
    })

    // Get specific blog (details)
    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await blogsCollection.findOne(query)
      res.send(result)
    })

    // Post Blog 
    app.post('/blogs', async (req, res) => {
      const blogs = req.body
      const result = await blogsCollection.insertOne(blogs)
      res.send(result)
    })

    // Update blog status
    app.patch('/blogs/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updateStatus = req.body
      const updateDoc = {
        $set: {
          status: updateStatus.status
        }
      }
      const result = await blogsCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // Delete Blog
    app.delete('/blogs/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await blogsCollection.deleteOne(query)
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