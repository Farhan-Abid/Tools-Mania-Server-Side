const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ivt5b.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const purchasesCollection = client.db('manufacturer_website').collection('purchases');
        const clickPurchasesCollection = client.db('manufacturer_website').collection('clickPurchases');

        // Api Naming Conevntion //

        app.get('/purchase', async(req,res) => {
            const query = {};
            const cursor = purchasesCollection.find(query);
            const purchases = await cursor.toArray();
            res.send(purchases); 
        })

        app.post('/clickPurchase', async(req,res) => {
            const clickPurchase = req.body;
            const result = await clickPurchasesCollection.insertOne(clickPurchase);
            res.send(result);
        })

    }
    finally{

    }

}

run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello from tools mania')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})