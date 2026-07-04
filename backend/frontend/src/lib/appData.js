export const STORAGE_KEYS = {
  campaigns: 'crowdspark-campaigns',
  pledges: 'crowdspark-pledges',
};

export const initialCampaigns = [
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
      { amount: 2500, title: 'Supporter Pack' },
    ],
  },
  {
    id: 'camp-2',
    title: 'Community Garden Kit',
    shortDescription: 'A starter kit to grow food and flowers in small urban spaces.',
    description: 'This kit helps families build a compact indoor or balcony garden with easy instructions and reusable planters.',
    category: 'design',
    fundingGoal: 80000,
    fundedAmount: 47000,
    backerCount: 132,
    thumbnail: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=800&q=80',
    videoPitchUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
    endDate: '2026-07-18',
    creatorName: 'Mina Patel',
    creatorRole: 'Community Builder',
    createdBy: 'mina@example.com',
    rewards: [
      { amount: 800, title: 'Seed Starter' },
      { amount: 1800, title: 'Garden Guide' },
    ],
  },
  {
    id: 'camp-3',
    title: 'AI Study Buddy',
    shortDescription: 'A smart notebook app that turns your notes into study plans.',
    description: 'AI Study Buddy helps students organize lessons, schedule revision, and review key ideas faster.',
    category: 'technology',
    fundingGoal: 150000,
    fundedAmount: 98000,
    backerCount: 301,
    thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80',
    videoPitchUrl: 'https://www.youtube.com/embed/aqz-KE-bpKQ',
    endDate: '2026-09-05',
    creatorName: 'Jordan Kim',
    creatorRole: 'EdTech Founder',
    createdBy: 'jordan@example.com',
    rewards: [
      { amount: 1200, title: 'Beta Access' },
      { amount: 3000, title: 'Premium Plan' },
    ],
  },
  {
    id: 'camp-4',
    title: 'Street Art Mural Project',
    shortDescription: 'A mural that brings local stories to life on a city wall.',
    description: 'This project funds artists, paint, and community workshops for a mural celebrating neighborhood history.',
    category: 'art',
    fundingGoal: 90000,
    fundedAmount: 61000,
    backerCount: 174,
    thumbnail: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&w=800&q=80',
    videoPitchUrl: 'https://www.youtube.com/embed/2Vv-BfVoq4g',
    endDate: '2026-10-10',
    creatorName: 'Lina Cruz',
    creatorRole: 'Visual Artist',
    createdBy: 'lina@example.com',
    rewards: [
      { amount: 900, title: 'Wall Poster' },
      { amount: 2400, title: 'Artist Meet-Up' },
    ],
  },
];

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

export function getProgressPercent(campaign) {
  const goal = Number(campaign.fundingGoal || 0);
  if (!goal) return 0;
  return Math.min(100, Math.round((Number(campaign.fundedAmount || 0) / goal) * 100));
}

export function createCampaignId() {
  return `camp-${Date.now()}`;
}
