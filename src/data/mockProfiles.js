// Curated profiles matching user reference screenshots & high-res photography

export const HOME_SWIPE_PROFILES = [
  {
    id: 'profile_priya',
    name: 'Priya',
    age: 21,
    city: 'Greater Noida',
    country: 'India',
    distance: '0 mi away',
    zodiac: 'Virgo',
    height: "162 cm (5'3\")",
    education: 'Master',
    verified: true,
    activeStatus: 'Active today',
    jobTitle: 'Design Student & Curator',
    intents: ['Long-term relationship', 'Friendship'],
    tags: ['Art lover', 'Photography', 'Coffee enthusiast'],
    photos: [
      '/photos/couple1.jpg',
      '/photos/couple2.jpg',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'
    ],
    quoteHeadline: 'Priya, 21',
    bio: 'Architecture enthusiast, sourdough baker, and lover of spontaneous weekend getaways.',
    promptQuestion: 'Ideal Sunday Morning',
    promptAnswer: 'Fresh pour-over coffee, listening to vinyl records, and long walk in the park.',
    voiceNote: {
      duration: '0:14',
      title: "Priya's Voice Intro",
      prompt: "What intentional dating means to me..."
    }
  },
  {
    id: 'profile_maya',
    name: 'Maya',
    age: 23,
    city: 'New Delhi',
    country: 'India',
    distance: '3 mi away',
    zodiac: 'Taurus',
    height: "168 cm (5'6\")",
    education: 'Bachelor of Fine Arts',
    verified: true,
    activeStatus: 'Active today',
    jobTitle: 'UX Designer',
    intents: ['Long-term relationship', 'New friends'],
    tags: ['Design', 'Pet lover', 'Jazz'],
    photos: [
      '/photos/couple2.jpg',
      '/photos/couple3.jpg',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80'
    ],
    quoteHeadline: 'Maya, 23',
    bio: 'Building simple digital experiences by day, exploring live music venues by night.',
    promptQuestion: 'The key to my heart is',
    promptAnswer: 'Unconditional honesty, dark espresso, and spontaneous road trips.',
    voiceNote: {
      duration: '0:18',
      title: "Maya's Audio Prompt",
      prompt: "My go-to travel story..."
    }
  },
  {
    id: 'profile_elena',
    name: 'Elena',
    age: 24,
    city: 'Mumbai',
    country: 'India',
    distance: '5 mi away',
    zodiac: 'Libra',
    height: "165 cm (5'5\")",
    education: 'Master of Science',
    verified: true,
    activeStatus: 'Active today',
    jobTitle: 'Software Engineer',
    intents: ['Life partner', 'Friendship'],
    tags: ['Active lifestyle', 'Hiking', 'Tech'],
    photos: [
      '/photos/couple3.jpg',
      '/photos/couple4.jpg'
    ],
    quoteHeadline: 'Elena, 24',
    bio: 'Quality over quantity in everything we choose to surround ourselves with.',
    promptQuestion: 'A life rule I live by',
    promptAnswer: 'Be present in every moment and always keep learning.',
    voiceNote: {
      duration: '0:12',
      title: "Elena's Voice Note",
      prompt: "Quick intro audio note..."
    }
  }
];

export const INITIAL_DAILY_MATCH = HOME_SWIPE_PROFILES[0];

export const EXPLORE_PROFILES = [
  {
    id: 'profile_priya',
    name: 'Priya',
    age: 21,
    city: 'Greater Noida, India',
    jobTitle: 'Design Student',
    tag: 'Design',
    photos: ['/photos/couple1.jpg'],
    bio: 'Architecture enthusiast, sourdough baker, and lover of spontaneous getaways.',
    tags: ['Long-term relationship', 'Friendship']
  },
  {
    id: 'profile_maya',
    name: 'Maya',
    age: 23,
    city: 'New Delhi, India',
    jobTitle: 'UX Designer',
    tag: 'UX Design',
    photos: ['/photos/couple2.jpg'],
    bio: 'Building simple digital experiences by day, exploring live acoustic music by night.',
    tags: ['Active lifestyle', 'Pet lover']
  }
];
