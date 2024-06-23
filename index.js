const express = require("express");
const cors = require("cors");

require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hotel Booking I Here");
});

console.log(process.env.DB_USER, process.env.DB_PASS);

// hotelServer

// tenaC4QKIwwd0ZLn

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.czpbf1c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const jobsCollection = client.db("Hyper_place").collection("jobs");
    const bidsCollection = client.db("Hyper_place").collection("bids");

    // Get all jobs route

    app.post("/addjobs", async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollection.insertOne(jobData);
      res.send(result);
    });

    app.get("/alljobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
    });

    app.put("/alljobs/:id", async (req, res) => {
      const id = req.params.id;
      const updateDoc = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateData = {
        $set: {
          ...updateDoc,
        },
      };
      const result = await jobsCollection.updateOne(query, updateData, options);
      res.send(result);
    });

    app.delete(`/alljobs/:id`, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/myjobs/:email", async (req, res) => {
      const email = req.params?.email;
      const query = { authorEmail: email };
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
      return;
    });

    app.post("/bids", async (req, res) => {
      const bidData = req.body;
      const result = await bidsCollection.insertOne(bidData);
      res.send(result);
    });

    app.get("/mybids/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userMail: email };
      const result = await bidsCollection.find(query).toArray();
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB! dddddd"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`hyper server is running on port ${port}`);
});
