const express = require("express");
const app = express();
const path = require("path");
const { MongoClient } = require("mongodb");

const PORT = 3030;
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Connect to the same MongoDB that MongoDB Express uses (port 27017)
const MONGO_URL =
  "mongodb://delta_admin:delta_password@localhost:27017/my-sample-db?authSource=admin";

// MongoDB client options
const mongoOptions = {
  useUnifiedTopology: true,
};

//GET all data from all collections
app.get("/getUsers", async (req, res) => {
  try {
    // Use exec to get all collections and their data
    const { exec } = require("child_process");

    // First get all collection names
    const listCollectionsCommand = `docker exec mongo mongosh my-sample-db -u delta_admin -p delta_password --authenticationDatabase admin --eval "JSON.stringify(db.getCollectionNames())" --quiet`;

    exec(listCollectionsCommand, (error, stdout, stderr) => {
      if (error) {
        console.error("Error:", error);
        res.status(500).send({ error: error.message });
        return;
      }

      if (stderr) {
        console.error("Stderr:", stderr);
        res.status(500).send({ error: stderr });
        return;
      }

      try {
        // Parse the collection names
        const collections = JSON.parse(stdout.trim());
        const allData = {};
        let completed = 0;

        if (collections.length === 0) {
          console.log("No collections found");
          res.send({});
          return;
        }

        // Get data from each collection
        collections.forEach((collectionName) => {
          const getDataCommand = `docker exec mongo mongosh my-sample-db -u delta_admin -p delta_password --authenticationDatabase admin --eval "JSON.stringify(db.${collectionName}.find({}).toArray())" --quiet`;

          exec(getDataCommand, (dataError, dataStdout, dataStderr) => {
            if (!dataError && !dataStderr) {
              try {
                const collectionData = JSON.parse(dataStdout.trim());
                allData[collectionName] = collectionData;
              } catch (parseError) {
                console.error(`Parse error for ${collectionName}:`, parseError);
                allData[collectionName] = [];
              }
            } else {
              console.error(
                `Error getting data from ${collectionName}:`,
                dataError || dataStderr
              );
              allData[collectionName] = [];
            }

            completed++;
            if (completed === collections.length) {
              console.log(
                "Connected successfully to server - returning all collections"
              );
              res.send(allData);
            }
          });
        });
      } catch (parseError) {
        console.error("Parse error:", parseError);
        res.status(500).send({ error: "Failed to parse MongoDB response" });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: error.message });
  }
});

//POST new user
app.post("/addUser", async (req, res) => {
  const userObj = req.body;
  console.log(req.body);
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    console.log("Connected successfully to server");

    const db = client.db("my-sample-db");
    const data = await db.collection("users").insertOne(userObj);
    console.log(data);
    console.log("data inserted in DB");

    res
      .status(201)
      .send({
        message: "User added successfully",
        insertedId: data.insertedId,
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: error.message });
  } finally {
    await client.close();
  }
});

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
