const mongoose = require('mongoose');
require('dotenv').config();
const Campaign = require('../models/Campaign');

async function list() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crowdspark');
    const camps = await Campaign.find().lean().exec();
    console.log('Campaigns:', camps);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

list();
