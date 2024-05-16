const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const router = express.Router();

// Movie schema and model
const movieSchema = new mongoose.Schema({}, { strict: false });
const Movie = mongoose.model('Movie', movieSchema, 'movies');

router.get('/', async (req, res) => {
  try {
    // Log environment variable to debug
    console.log('MONGODB_URI:', process.env.MONGODB_URI);

    const sts = new AWS.STS();
    const assumedRole = await sts.assumeRole({
      RoleArn: 'arn:aws:iam::552010969569:role/LambdaMongoDBAccessRole',
      RoleSessionName: 'MongoDBAccessSession'
    }).promise();

    const { AccessKeyId, SecretAccessKey, SessionToken } = assumedRole.Credentials;

    // Check if the environment variable is defined
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    // Replace placeholders in URI template with actual credentials
    const uri = process.env.MONGODB_URI
      .replace('<AWS_ACCESS_KEY_ID>', encodeURIComponent(AccessKeyId))
      .replace('<AWS_SECRET_ACCESS_KEY>', encodeURIComponent(SecretAccessKey));

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      auth: {
        username: AccessKeyId,
        password: SecretAccessKey
      },
      authMechanism: 'MONGODB-AWS'
    });

    const movies = await Movie.find({});
    res.json(movies);

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    mongoose.connection.close();
  }
});

app.use('/.netlify/functions/api', router);
// app.use('/', router);

module.exports.handler = serverless(app);
