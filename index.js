const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mordayw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        const usersCollection = client.db("tasks-app").collection("users");
        const tasksCollection = client.db("tasks-app").collection("tasks");
        //database table
        //  const usersCollection = client.db("daily-task-manager").collection("users");
        //  const tasksCollection = client.db("daily-task-manager").collection("allTask");



        // JWT
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '24h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });


        app.post('/users', async (req, res) => {
            const data = req.body;
            const result = await usersCollection.insertOne(data);
            res.send(result)
        });

        app.get('/allTask', async (req, res) => {
            const query = {}
            const result = await tasksCollection.find(query).toArray();
            res.send(result);
        });

        // add new task
        app.post('/addTask', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const decodedQuery = { email: decodedEmail }
            const user = await usersCollection.findOne(decodedQuery);
            if (!user) {
                return res.status(403).send({ message: 'forbidden access' })
            }


            const data = req.body;
            const result = await tasksCollection.insertOne(data);
            res.send(result)
        });
        // get task using email
        app.get('/myTask', async (req, res) => {
            const email = req.query.email;
            const query = { email: email, complete: false }
            const result = await tasksCollection.find(query).toArray();
            res.send(result)
        });

        // delete task
        app.delete('/myTask/delete/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const decodedQuery = { email: decodedEmail }
            const user = await usersCollection.findOne(decodedQuery);
            if (!user) {
                return res.status(403).send({ message: 'forbidden access' })
            }


            const id = req.params.id;
            const userQuery = {
                _id: ObjectId(id)
            }

            const result = await tasksCollection.deleteOne(userQuery);
            res.send(result);
        });

        // Complete task
        app.put('/task/update/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const decodedQuery = { email: decodedEmail }
            const user = await usersCollection.findOne(decodedQuery);
            if (!user) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    complete: true
                }
            }
            const result = await tasksCollection.updateOne(filter, updatedDoc, options);
            res.send(result)


        });

        // get task using email
        app.get('/CompleteTask', async (req, res) => {
            const email = req.query.email;
            const query = { email: email, complete: true }
            const result = await tasksCollection.find(query).toArray();
            res.send(result)
        });



        // Not Complete task
        app.put('/task/notComplete/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const decodedQuery = { email: decodedEmail }
            const user = await usersCollection.findOne(decodedQuery);
            if (!user) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    complete: false
                }
            }
            const result = await tasksCollection.updateOne(filter, updatedDoc, options);
            res.send(result)


        });


        app.post('/MyTask/updateTask/:id', (req, res) => {
            const id = req.params.id;
            const updatedTask = req.body;
            console.log(updatedTask)
        });

        app.patch('/updateTask/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    task: data.task
                }
            }
            const result = await tasksCollection.updateOne(filter, updatedDoc, options);
            res.send(result)

        });



    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Tasks App is Running')
})

app.listen(port, () => {
    console.log(`Tasks App running on Server ${port}`);
})