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
    const studyCollection = db.collection("studies");
    const findPartnerCollection = db.collection("findPartners");
    const myConnectionCollection = db.collection("myConnections");
    const userCollection = db.collection("users");

    // USER POST
    app.post("/users", async (req, res) => {
      try {
        const result = await userCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to create user." });
      }
    });

    // STUDIES
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

    // FIND PARTNERS
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

    app.post("/create-partner", async (req, res) => {
      try {
        const newPartner = { ...req.body, createdAt: new Date() };
        const result = await findPartnerCollection.insertOne(newPartner);
        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ message: "Failed to create partner." });
      }
    });

    // POST MY CONNECTIONS
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

    app.get("/myConnection", async (req, res) => {
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

    // DELETE DATA
    app.delete("/delete-partner/:id", async (req, res) => {
      try {
        const id = req.params.id;
        let result = await myConnectionCollection.deleteOne({ _id: id });
        if (result.deletedCount === 0 && ObjectId.isValid(id)) {
          result = await myConnectionCollection.deleteOne({
            _id: new ObjectId(id),
          });
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

    // GET SINGLE API
    app.get("/myConnection/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = {
          _id: id,
        };
        const partner = await myConnectionCollection.findOne(query);
        if (!partner)
          return res.status(404).send({ message: "Partner not found" });
        res.send(partner);
      } catch (error) {
        console.error("Error fetching partner:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // UPDATE MY CONNECTION
    app.put("/update-myConnection/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const data = req.body;
        const query = ObjectId.isValid(id)
          ? { _id: new ObjectId(id) }
          : { _id: id };
        const result = await myConnectionCollection.updateOne(query, {
          $set: req.body,
        });

        // if (result.matchedCount === 0)
        //   return res.status(404).send({ message: "Not found" });
        res.send({ success: true });
      } catch (error) {
        res.status(500).send({ message: "Update failed" });
      }
    });

    // UPDATE PARTNER
    app.post("/update-partner", async (req, res) => {
      try {
        const { _id, ...updateData } = req.body;
        let result;
        if (_id) {
          result = await findPartnerCollection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: updateData }
          );
        } else {
          result = await findPartnerCollection.insertOne(updateData);
        }
        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ message: "Update failed" });
      }
    });

    // GET ALL TESTIMONIALS
    const testimonialCollection = db.collection("testimonials");

    app.get("/testimonials", async (req, res) => {
      try {
        const result = await testimonialCollection
          .find({ verified: true })
          .sort({ createdAt: -1 })
          .limit(10)
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch testimonials." });
      }
    });

    // Features
    app.get("/featured-partners", async (req, res) => {
      const result = await findPartnerCollection
        .find({ featured: true })
        .limit(6)
        .toArray();
      res.send(result);
    });

    // POST: Send Partner Message
    app.post("/send-partner-message", (req, res) => {
      const { to, name, message } = req.body;
      console.log("Message to:", to, name, message);
      res.json({ success: true, message: "Message sent!" });
    });



    // === ROOT ===
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
