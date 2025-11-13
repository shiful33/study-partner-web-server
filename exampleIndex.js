const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
// const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// serviceKey.json
admin.initializeApp({
  credential: admin.credential.cert("./serviceKey.json"),
});

console.log("Firebase Admin SDK Initialized!");

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@ahmedtpro.4kxy1cz.mongodb.net/?appName=AhmedTPro`;

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
    const myConnectionCollection = db.collection("myConnection");
    const userCollection = db.collection("users");
    const testimonialCollection = db.collection("testimonials");

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
        const newPartner = {
          ...req.body,
          createdAt: new Date(),
          userEmail: req.user.email,
        };
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
          userEmail: req.user.email,
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
          userEmail: req.user.email,
          requestedAt: new Date(),
        });
        res.send({ success: true, message: "Partner request sent!" });
      } catch (error) {
        console.error("Error sending request:", error);
        res.status(500).send({ message: "Failed to send request." });
      }
    });

    // GET MY CONNECTIONS
    app.get("/myConnection", async (req, res) => {
      const result = await myConnectionCollection.find().toArray()
      res.send(result)
     /*  try {
        const result = await myConnectionCollection
          .find()
          .sort({ requestedAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch connections." });
      } */
    });

    // DELETE PARTNER
    app.delete("/delete-partner/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // === ID ফরম্যাট চেক ===
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    // === ডিলিট করো ===
    const result = await myConnectionCollection.deleteOne({
      _id: new ObjectId(id),
    });

    console.log("Delete result:", result); // দেখো

    // === চেক করো কতটা ডিলিট হয়েছে ===
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    // === সফল হলে ===
    res.status(200).json({ success: true, message: "Partner removed successfully" });

  } catch (error) {
    console.error("Delete Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

    // GET SINGLE CONNECTION
    app.delete("/delete-partner/:id", async (req, res) => { 
    const { id } = req.params;

    try {
        // Mongoose ব্যবহার করে ডিলিট লজিক
        const result = await Partner.findByIdAndDelete(id); 
        
        if (!result) {
            return res.status(404).json({ success: false, message: "Partner not found" });
        }
        
        // সফল সাড়া
        res.json({ success: true, message: "Partner deleted successfully" });
        
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ success: false, message: "Server error during deletion" });
    }
});

    // UPDATE MY CONNECTION
    app.put("/update-myConnection/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = {
          _id: ObjectId.isValid(id) ? new ObjectId(id) : id,
          userEmail: req.user.email,
        };
        const result = await myConnectionCollection.updateOne(query, {
          $set: req.body,
        });

        res.send({ success: true, message: "Updated successfully" });
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
          const query = {
            _id: new ObjectId(_id),
            userEmail: req.user.email,
          };
          result = await findPartnerCollection.updateOne(query, {
            $set: updateData,
          });
          if (result.matchedCount === 0) {
            return res
              .status(404)
              .send({ message: "Partner not found or unauthorized" });
          }
        } else {
          result = await findPartnerCollection.insertOne({
            ...updateData,
            userEmail: req.user.email,
          });
        }
        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ message: "Update failed" });
      }
    });

    // GET ALL TESTIMONIALS
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
      console.log("Message from:", req.user.email, "to:", to, "msg:", message);
      res.json({ success: true, message: "Message sent!" });
    });

    // === ROOT ===
    app.get("/", (req, res) => {
      res.send("Study Partner Server is Running with JWT Security!");
    });

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}

run().catch(console.dir);
