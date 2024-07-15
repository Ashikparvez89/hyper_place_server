const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://hyper-place.web.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(cookieParser());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hotel Booking I Here");
});

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

// jwt b=verify middleware

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unaothorised access" });
  }
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
      if (err) {
        console.log("not verify");
        return res.status(401).send({ message: "Unaothorised access" });
      }
      req.user = decoded;
      next();
    });
  }
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const jobsCollection = client.db("Hyper_place").collection("jobs");
    const bidsCollection = client.db("Hyper_place").collection("bids");

    // genarete token from browser while login

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.get("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });

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

    // get all job for pagination

    app.get("/all-jobs", async (req, res) => {
      const size = parseInt(req.query.size) - 1;
      const page = parseInt(req.query.page);
      const filter = req.query.filter;
      const sort = req.query.sort;
      const search = req.query.search;
      console.log(search);

      let options = {};
      if (sort) {
        const sortField = "deadline";
        const sortOrder = sort === "asc" ? 1 : -1;
        options.sort = { [sortField]: sortOrder };
      }

      let query = {};
      if (search) {
        query.jobName = { $regex: search, $options: "i" };
      }
      if (filter && filter !== "All") {
        query.category = filter;
      }

      // if (filter && filter !== "All") {
      //   query = { category: filter };
      // }
      const result = await jobsCollection
        .find(query)
        .skip(size * page)
        .limit(page)
        .sort(options.sort || {})
        .toArray();
      res.send(result);
    });

    // get all jobs number for pagination

    app.get("/alljobs-count", async (req, res) => {
      const filter = req.query.filter;
      const search = req.query.search;
      let query = {};
      if (search) {
        query.jobName = { $regex: search, $options: "i" };
      }
      if (filter && filter !== "All") {
        query.category = filter;
      }
      const count = await jobsCollection.countDocuments(query);
      res.send({ count });
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

    app.delete(`/alljobs/:id`, verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/myjobs/:email", verifyToken, async (req, res) => {
      const email = req.params?.email;
      const query = { authorEmail: email };
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
      return;
    });

    app.post("/bids", verifyToken, async (req, res) => {
      const bidData = req.body;
      console.log(bidData);
      // check if data exits on db

      const query = { userMail: bidData?.userMail, jobid: bidData.jobid };
      console.log("query email", query);
      const appliedJob = await bidsCollection.findOne(query);
      console.log("applied mail", appliedJob);
      if (appliedJob) {
        return res.status(400).send({
          message:
            "You already bid for this job, please try onother one job for bid",
        });
      }
      const result = await bidsCollection.insertOne(bidData);
      res.send(result);
    });

    app.get("/mybids/:email", verifyToken, async (req, res) => {
      const tokenEmail = req.user.email;
      console.log(tokenEmail);
      const email = req.params.email;
      if (tokenEmail !== email) {
        return res.status(401).send({ message: "unaothourised access" });
      }
      const query = { userMail: email };
      const result = await bidsCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/bidreq/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { authourEmail: email };
      const result = await bidsCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/mybids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { jobid: id };
      const result = await bidsCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/bidreq/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const status = req.body;
      const query = { _id: new ObjectId(id) };
      const updateData = {
        $set: status,
      };
      const result = await bidsCollection.updateOne(query, updateData);
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
