const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB URI
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
    console.log("Connected to MongoDB!");

    const db = client.db("study-db");

    // Collections
    const studyCollection = db.collection("studies");
    const findPartnerCollection = db.collection("findPartners");
    const myConnectionCollection = db.collection("myConnections");
    const userCollection = db.collection("users");

    // Create User
    app.post("/users", async (req, res) => {
      try {
        const result = await userCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to create user." });
      }
    });

    // Get Top 6 Studies (Home)
    app.get("/studies", async (req, res) => {
      try {
        const result = await studyCollection
          .find()
          .sort({ rating: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch studies." });
      }
    });

    // Get Single Study Details
    app.get("/studies/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await studyCollection.findOne({ _id: new ObjectId(id) });
        if (!result)
          return res.status(404).send({ message: "Study not found" });
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Invalid ID" });
      }
    });

    // Get All Find Partners
    app.get("/find-partners", async (req, res) => {
      try {
        const result = await findPartnerCollection
          .find()
          .sort({ rating: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch partners." });
      }
    });

    // Get Single Find Partner Details
    app.get("/find-partners/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await findPartnerCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!result)
          return res.status(404).send({ message: "Partner not found" });
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Invalid ID" });
      }
    });

    // Create Partner Profile
    app.post("/create-partner", async (req, res) => {
      try {
        const newPartner = { ...req.body, createdAt: new Date() };
        const result = await findPartnerCollection.insertOne(newPartner);
        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ message: "Failed to create partner." });
      }
    });

    // Send Partner Request & Save to MyConnections
    app.post("/send-partner-request", async (req, res) => {
      try {
        const partnerData = req.body;

        const exists = await myConnectionCollection.findOne({
          _id: partnerData._id,
        });
        if (exists) {
          return res.send({
            success: false,
            message: "Already in your connections!",
          });
        }

        // Save to MyConnections
        await myConnectionCollection.insertOne({
          ...partnerData,
          _id: partnerData._id,
          requestedAt: new Date(),
        });

        res.send({ success: true, message: "Partner request sent!" });
      } catch (error) {
        console.error("Error sending request:", error);
        res.status(500).send({ message: "Failed to send request." });
      }
    });

    // Get My Connections
    app.get("/my-connections", async (req, res) => {
      try {
        const result = await myConnectionCollection
          .find()
          .sort({ requestedAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch connections." });
      }
    });

    // Delete Partner from MyConnections
    const { ObjectId } = require("mongodb");

    app.delete("/delete-partner/:id", async (req, res) => {
      try {
        const id = req.params.id;

        let result = await myConnectionCollection.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
          if (ObjectId.isValid(id)) {
            result = await myConnectionCollection.deleteOne({
              _id: new ObjectId(id),
            });
          }
        }

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "Partner not found" });
        }

        res.send({ success: true, message: "Partner removed" });
      } catch (error) {
        console.error("Delete error:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/", (req, res) => {
      res.send("Study Partner Server is Running!");
    });

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}

run().catch(console.dir);
