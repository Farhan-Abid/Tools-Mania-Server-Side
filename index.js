const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ivt5b.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// jwt token verify
const verifyJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      req.decoded = decoded;
      next();
    });
  };

// async await build


async function run(){
    try{
        await client.connect();
        const purchasesCollection = client.db('manufacturer_website').collection('purchases');
        const clickPurchasesCollection = client.db('manufacturer_website').collection('clickPurchases');
        const userCollection = client.db("manufacturer_website").collection("users");

        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({
              email: requester,
            });
            if (requesterAccount.role === "admin") {
              next();
            } else {
              res.status(403).send({ message: "Forbidden" });
            }
          };
// get method usage 

        app.get('/purchase', async(req,res) => {
            const query = {};
            const cursor = purchasesCollection.find(query);
            const purchases = await cursor.toArray();
            res.send(purchases); 
        })

        app.post("/purchase", verifyJwt, verifyAdmin, async (req, res) => {
            const product = req.body;
            const result = await purchasesCollection.insertOne(product);
            res.send(result);
          });
          app.get("/user", verifyJwt, async (req, res) => {
            const user = await userCollection.find().toArray();
            res.send(user);
          });
          app.get("/admin/:email", async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === "admin";
            res.send({ admin: isAdmin });
          });
      
          app.put("/user/admin/:email", verifyJwt, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
      
            const updateDoc = {
              $set: { role: "admin" },
            };
      
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
          });
      
        //   put method usage 
          app.put("/user/:email", async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const token = jwt.sign(
              { email: email },
              process.env.ACCESS_TOKEN_SECRET,
              { expiresIn: "1h" }
            );
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send({ result, token });
          });

          //get method usage to show data

        app.get("/clickPurchase", verifyJwt, async (req, res) => {
            const customer = req.query.customer;
      
            const token = req.headers.authorization;
            const decodedEmail = req.decoded.email;
            if (customer === decodedEmail) {
              const query = { customer: customer };
              const bookings = await clickPurchasesCollection.find(query).toArray();
              return res.send(bookings);
            } else {
              return res.status(403).send({ message: "Forbidden access" });
            }
          });
      
          app.post("/clickPurchase", async (req, res) => {
            const booking = req.body;
      
            const result = await clickPurchasesCollection.insertOne(booking);
            res.send({ success: true, result });
          });

    }
    finally{

    }

}

run().catch(console.dir);

// server show
app.get('/', (req, res) => {
  res.send('Hello from tools mania')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})