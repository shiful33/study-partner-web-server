const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


const uri =
  "mongodb+srv://StudyPartner:74Leo9jjU8yJnLXw@ahmedtpro.4kxy1cz.mongodb.net/?appName=AhmedTPro";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("study-db");
    const studyCollection = db.collection("studies");

    //Studies Get API call
    app.get("/studies", async (req, res) => {
      try {
        const result = await studyCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Database query failed:", error);
        res.status(500).send({ message: "Failed to fetch studies data." });
      }
    });





    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. Successfully connected to MongoDB!");

    app.listen(port, () => {
      console.log(`The Study Partner Web Server is Running on port ${port}`);
    });
  } catch (error) {
    console.error("Critical: Failed to connect to MongoDB.", error);
  }
}

app.get("/", (req, res) => {
  res.send("The Study Partner Web Server is Running!");
});

run().catch(console.dir);
