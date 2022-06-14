const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const app = express();

// express middleware
app.use(cors());
app.use(express.json());

// database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yccrv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Middletier
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  // verify a token symmetric
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const userCollection = client.db('blinkmotors-db').collection('users');
    const reviewCollection = client.db('blinkmotors-db').collection('reviews');
    const productCollection = client
      .db('blinkmotors-db')
      .collection('products');
    const orderCollection = client.db('blinkmotors-db').collection('orders');
    const blogCollection = client.db('blinkmotors-db').collection('blogs');

    // ! GET METHOD
    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin });
    });

    app.get('/product', async (req, res) => {
      const products = await productCollection.find().toArray();
      res.send(products);
    });

    app.get('/product/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });

    app.get('/user', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.get('/user/profile/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await userCollection.findOne(filter);
      res.send(result);
    });

    app.get('/order', verifyJWT, async (req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result);
    });
    app.get('/order/:email', verifyJWT, async (req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result);
    });

    app.get('/user/review', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });
    app.get('/user/blog', async (req, res) => {
      const result = await blogCollection.find().toArray();
      res.send(result);
    });

    // ! DELETE METHOD
    app.delete('/order/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    // ! POST METHOD
    app.post('/product', verifyJWT, async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      console.log(result);
      res.send(result);
    });
    app.post('/user/review', verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    app.post('/admin/blog', verifyJWT, async (req, res) => {
      const blog = req.body;
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });

    app.post('/order', verifyJWT, async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    // ! PUT METHOD
    app.put('/user/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });

      if (requesterAccount.role === 'admin') {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'admin' },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        res.status(403).send({ message: 'forbidden' });
      }
    });

    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1d' }
      );
      res.send({ result, token });
    });

    app.put('/user/profile/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const userInfo = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: userInfo,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.put('/order/admin/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: { status: 'confirmed' },
      };
      const result = await orderCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
  } finally {
    //
  }
}
run().catch(console.dir);

// Initial response for call root directory
app.get('/', (req, res) => {
  res.send(`Heroku Server Running on Port ${port}`);
});

app.listen(port, () => {
  console.log(`Blink Motors listening on port`, port);
});
