const express = require('express');
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Pledge = require('../models/Pledge');

const router = express.Router();

let memoryCampaigns = [];
let memoryPledges = [];

// sample seed data used when DB is not connected and memory is empty
const sampleCampaigns = [
  {
    id: 'camp-1',
    title: 'Solar-Powered Backpack',
    shortDescription: 'A durable backpack that charges your phone on the go.',
    description: 'This backpack includes a slim solar panel and power bank for students and travelers who need reliable charging anywhere.',
    category: 'technology',
    fundingGoal: 120000,
    fundedAmount: 86000,
    backerCount: 218,
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    videoPitchUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    endDate: '2026-08-20',
    creatorName: 'Asha Rao',
    creatorRole: 'Product Designer',
    createdBy: 'creator@example.com',
    rewards: [
      { amount: 1000, title: 'Early Bird' },
      { amount: 2500, title: 'Supporter Pack' }
    ]
  }
];

const findCampaign = async (id) => {
  if (mongoose.connection.readyState === 1) {
    const byId = await Campaign.findById(id).exec();
    if (byId) return byId;
    return Campaign.findOne({ id }).exec();
  }
  return memoryCampaigns.find((c) => String(c._id || c.id) === String(id) || String(c.id) === String(id)) || null;
};

// GET /campaigns - list campaigns
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const campaigns = await Campaign.find().lean().exec();
      // if DB empty but memory has items, prefer DB
      return res.json(campaigns);
    }
    if (!memoryCampaigns.length) memoryCampaigns = sampleCampaigns.slice();
    return res.json(memoryCampaigns);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /campaigns/:id - single campaign
// GET /campaigns/pledges - list pledges (optionally filter by backerEmail query)
router.get('/pledges/all', async (req, res) => {
  try {
    const { backerEmail } = req.query;
    if (mongoose.connection.readyState === 1) {
      const q = backerEmail ? { backerEmail } : {};
      // populate campaign title for frontend display
      const pledges = await Pledge.find(q).populate({ path: 'campaignId', select: 'title' }).lean().exec();
      // normalize response: include campaignTitle and campaignId as string
      const normalized = pledges.map(p => ({
        ...p,
        campaignTitle: p.campaignId ? (p.campaignId.title || null) : null,
        campaignId: p.campaignId ? String(p.campaignId._id || p.campaignId) : (p.campaignId || null),
      }));
      return res.json(normalized);
    }
    const filtered = backerEmail ? memoryPledges.filter((p) => p.backerEmail === backerEmail) : memoryPledges;
    return res.json(filtered);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /campaigns/:id - single campaign
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await findCampaign(id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    return res.json(campaign);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /campaigns - create
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    if (mongoose.connection.readyState === 1) {
      const created = new Campaign(payload);
      await created.save();
      return res.status(201).json(created);
    }

    const created = {
      id: `camp-${Date.now()}`,
      ...payload,
    };
    memoryCampaigns.unshift(created);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /campaigns/:id/pledge - add a pledge
router.post('/:id/pledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { backerEmail, amount } = req.body || {};
    if (!backerEmail || !amount) return res.status(400).json({ message: 'backerEmail and amount are required' });

    if (mongoose.connection.readyState === 1) {
      console.log('Pledge endpoint: using DB path');
      const campaign = await findCampaign(id);
      if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
      campaign.fundedAmount = Number(campaign.fundedAmount || 0) + Number(amount);
      campaign.backerCount = Number(campaign.backerCount || 0) + 1;
      await campaign.save();
      const createdPledge = await Pledge.create({ campaignId: campaign._id, backerEmail, amount });
      return res.status(201).json({ pledge: createdPledge, campaign });
    }
    console.log('Pledge endpoint: using memory path');

    const campaign = memoryCampaigns.find((c) => String(c._id || c.id) === String(id) || String(c.id) === String(id));
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    campaign.fundedAmount = Number(campaign.fundedAmount || 0) + Number(amount);
    campaign.backerCount = Number(campaign.backerCount || 0) + 1;
    const pledge = { id: `pledge-${Date.now()}`, campaignId: campaign.id, campaignTitle: campaign.title || null, backerEmail, amount, createdAt: new Date().toISOString() };
    memoryPledges.push(pledge);
    return res.status(201).json({ pledge, campaign });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
