const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  title: { type: String, required: true },
});

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  shortDescription: { type: String },
  description: { type: String },
  category: { type: String },
  fundingGoal: { type: Number, default: 0 },
  fundedAmount: { type: Number, default: 0 },
  backerCount: { type: Number, default: 0 },
  thumbnail: { type: String },
  videoPitchUrl: { type: String },
  endDate: { type: String },
  creatorName: { type: String },
  creatorRole: { type: String },
  createdBy: { type: String },
  rewards: { type: [rewardSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
