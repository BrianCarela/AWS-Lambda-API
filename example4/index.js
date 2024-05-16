const express = require('express');
const serverless = require('serverless-http');
const MongoClient = require('mongodb').MongoClient;
const AWS = require('aws-sdk');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const router = express.Router();

// Define MongoDB connection string from environment variables
const MONGODB_URI_TEMPLATE = process.env.MONGODB_URI;

// Cached connection
let cachedDb = null;

// Checking logs
console.log('lambda receiving signal')

// Function to connect to MongoDB
async function connectToDatabase() {
  console.log('connecting to MongoDB...')

  if (cachedDb) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  console.log('Connecting to MongoDB');
  const sts = new AWS.STS();
  const assumedRole = await sts.assumeRole({
    RoleArn: 'arn:aws:iam::552010969569:role/LambdaMongoDBAccessRole',
    RoleSessionName: 'MongoDBAccessSession'
  }).promise();

  const { AccessKeyId, SecretAccessKey, SessionToken } = assumedRole.Credentials;

  if (!MONGODB_URI_TEMPLATE) {
    throw new Error('MONGODB_URI_TEMPLATE is not defined');
  }

  const uri = MONGODB_URI_TEMPLATE
    .replace('<AWS_ACCESS_KEY_ID>', encodeURIComponent(AccessKeyId))
    .replace('<AWS_SECRET_ACCESS_KEY>', encodeURIComponent(SecretAccessKey));

  console.log('MongoDB URI:', uri);

  const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db('sample_mflix');

  cachedDb = db;
  return db;
}

// Temporary route for testing
router.get('/test', (req, res) => {
  console.log('Test route is working')
  res.json({ message: 'Test route is working' });
});

// Route to fetch movies
router.get('/movies', async (req, res) => {
  try {
    console.log('Received request for /movies');
    console.log('MONGODB_URI_TEMPLATE:', process.env.MONGODB_URI);

    const db = await connectToDatabase();

    console.log('Connected to MongoDB');

    const movies = await db.collection('movies').find({}).limit(20).toArray();
    console.log('Movies fetched:', movies);

    res.json(movies);
  } catch (error) {
    console.error('Error in /movies route:', error.message, error);
    res.status(500).json({ error: error.message });
  }
});

// Use the base path
app.use('/', router); // For root path testing
app.use('/.netlify/functions/api', router); // For AWS Lambda Internal Testing


module.exports.handler = serverless(app);
