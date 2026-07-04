const mongoose = require('mongoose');
require('dotenv').config();
const Pledge = require('../models/Pledge');

async function list() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crowdspark');
    const pledges = await Pledge.find().lean().exec();
    console.log('Pledges:', pledges);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

list();
