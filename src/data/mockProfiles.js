// Real & Curated User Profiles Registry for Cufy Dating Platform
// Automatically matches male users with female profiles and female users with male profiles.

export const FEMALE_CURATED_PROFILES = [
  {
    id: 'fem_1',
    name: 'Ananya Sharma',
    age: 23,
    gender: 'Woman',
    city: 'Greater Noida',
    activeStatus: 'Active today',
    intents: ['Serious relationship', 'Life partner'],
    photos: ['/photos/front1.jpg', '/photos/front2.jpg'],
    bio: 'Architecture student at Bennett. Lover of warm matcha, indie acoustics & sunset photography ☕✨',
    promptQuestion: 'Ideal Sunday Morning',
    promptAnswer: 'Sipping warm matcha latte while listening to acoustic vinyl records.',
    voiceNote: { title: 'Coffee & Vinyl', prompt: 'Tell me your favorite Sunday routine', duration: '0:18' },
    distance: '3 km away',
    zodiac: 'Libra',
    height: "165 cm (5'5\")",
    education: 'Bachelor in Architecture',
    is_verified: true,
    email: 'ananya.sharma@cufy.app'
  },
  {
    id: 'fem_2',
    name: 'Riya Patel',
    age: 24,
    gender: 'Woman',
    city: 'Noida Sector 62',
    activeStatus: 'Active now',
    intents: ['Long-term relationship', 'Deep connection'],
    photos: ['/photos/front2.jpg', '/photos/couple1.jpg'],
    bio: 'Product Designer by day, amateur potter by night. Always down for spontaneous road trips 🚗🎨',
    promptQuestion: 'The way to win me over is',
    promptAnswer: 'Surprise me with homemade pasta and a great 90s indie playlist.',
    voiceNote: { title: 'Roadtrips & Art', prompt: 'What song describes your soul?', duration: '0:22' },
    distance: '5 km away',
    zodiac: 'Taurus',
    height: "162 cm (5'4\")",
    education: 'Master in Design, NIFT',
    is_verified: true,
    email: 'riya.patel@cufy.app'
  },
  {
    id: 'fem_3',
    name: 'Sneha Roy',
    age: 22,
    gender: 'Woman',
    city: 'Delhi NCR',
    activeStatus: 'Active 2h ago',
    intents: ['Serious relationship'],
    photos: ['/photos/front3.jpg', '/photos/couple2.jpg'],
    bio: 'Software Engineer & dog mom 🐶. Looking for someone who matches my energy at live music gigs 🎸',
    promptQuestion: 'Two truths and a lie',
    promptAnswer: 'I have been to 12 countries, I solve a Rubik’s cube in 40s, and I hate chocolate.',
    voiceNote: { title: 'Gigs & Good Vibe', prompt: 'First concert you ever attended?', duration: '0:15' },
    distance: '8 km away',
    zodiac: 'Leo',
    height: "168 cm (5'6\")",
    education: 'B.Tech Computer Science',
    is_verified: true,
    email: 'sneha.roy@cufy.app'
  },
  {
    id: 'fem_4',
    name: 'Priya Verma',
    age: 25,
    gender: 'Woman',
    city: 'Gurugram',
    activeStatus: 'Active today',
    intents: ['Serious relationship', 'Life partner'],
    photos: ['/photos/couple5.jpg', '/photos/front1.jpg'],
    bio: 'Marketing strategist & yoga practitioner. Big fan of golden hour walks and deep late-night talks 🌅',
    promptQuestion: 'My simple pleasures',
    promptAnswer: 'Fresh lilies on Monday morning and quiet golden hour sunlight.',
    voiceNote: { title: 'Sunsets & Stories', prompt: 'Share your happiest memory this year', duration: '0:20' },
    distance: '12 km away',
    zodiac: 'Cancer',
    height: "160 cm (5'3\")",
    education: 'MBA, FMS Delhi',
    is_verified: true,
    email: 'priya.verma@cufy.app'
  },
  {
    id: 'fem_5',
    name: 'Diya Kapoor',
    age: 23,
    gender: 'Woman',
    city: 'Greater Noida',
    activeStatus: 'Active now',
    intents: ['Serious relationship'],
    photos: ['/photos/front1.jpg', '/photos/front3.jpg'],
    bio: 'Fashion Stylist & foodie. Looking for genuine connection with a warm smile ✨',
    promptQuestion: 'Together we could',
    promptAnswer: 'Explore hidden street food gems across the city.',
    voiceNote: { title: 'Food & Fashion', prompt: 'Best street food spot in town?', duration: '0:16' },
    distance: '4 km away',
    zodiac: 'Pisces',
    height: "165 cm (5'5\")",
    education: 'Fashion Communication, Pearl Academy',
    is_verified: true,
    email: 'diya.kapoor@cufy.app'
  },
  {
    id: 'fem_6',
    name: 'Tanvi Singh',
    age: 24,
    gender: 'Woman',
    city: 'Noida',
    activeStatus: 'Active today',
    intents: ['Life partner'],
    photos: ['/photos/front2.jpg', '/photos/couple3.jpg'],
    bio: 'Journalist & book collector. Searching for someone to exchange recommendations & coffee with 📚☕',
    promptQuestion: 'A non-negotiable for me',
    promptAnswer: 'Intellectual curiosity and kindness towards servers.',
    voiceNote: { title: 'Books & Brews', prompt: 'What book changed your perspective?', duration: '0:21' },
    distance: '6 km away',
    zodiac: 'Scorpio',
    height: "170 cm (5'7\")",
    education: 'MA Journalism, DU',
    is_verified: true,
    email: 'tanvi.singh@cufy.app'
  }
];

export const MALE_CURATED_PROFILES = [
  {
    id: 'male_1',
    name: 'Aarav Kapoor',
    age: 25,
    gender: 'Man',
    city: 'Greater Noida',
    activeStatus: 'Active today',
    intents: ['Serious relationship', 'Life partner'],
    photos: ['/photos/couple4_opt.jpg', '/photos/front2.jpg'],
    bio: 'UI/UX Designer & fitness enthusiast. Passionate about minimalism, photography, and good filter coffee 📸',
    promptQuestion: 'I will know I found the one when',
    promptAnswer: 'We can laugh endlessly over tiny silly jokes without speaking a word.',
    voiceNote: { title: 'Design & Coffee', prompt: 'What is your favorite travel memory?', duration: '0:19' },
    distance: '2 km away',
    zodiac: 'Aries',
    height: "180 cm (5'11\")",
    education: 'B.Des, IIT Delhi',
    is_verified: true,
    email: 'aarav.kapoor@cufy.app'
  },
  {
    id: 'male_2',
    name: 'Kabir Mehta',
    age: 26,
    gender: 'Man',
    city: 'Noida',
    activeStatus: 'Active now',
    intents: ['Serious relationship'],
    photos: ['/photos/couple3.jpg', '/photos/couple1.jpg'],
    bio: 'Financial Analyst & weekend trekker. Looking for someone genuine to build a meaningful life together.',
    promptQuestion: 'A non-negotiable for me',
    promptAnswer: 'Emotional honesty, empathy, and mutual respect.',
    voiceNote: { title: 'Treks & Markets', prompt: 'Mountains or beaches?', duration: '0:16' },
    distance: '7 km away',
    zodiac: 'Sagittarius',
    height: "183 cm (6'0\")",
    education: 'CFA & B.Com (Hons), SRCC',
    is_verified: true,
    email: 'kabir.mehta@cufy.app'
  },
  {
    id: 'male_3',
    name: 'Rohan Malhotra',
    age: 24,
    gender: 'Man',
    city: 'Delhi NCR',
    activeStatus: 'Active 1h ago',
    intents: ['Long-term relationship'],
    photos: ['/photos/couple2.jpg', '/photos/front3.jpg'],
    bio: 'Founder & Tech Explorer. Love deep conversations about philosophy, AI, and rock classics 🎧',
    promptQuestion: 'My greenest flag',
    promptAnswer: 'I will make you a 3-course dinner if you tell me you had a bad day.',
    voiceNote: { title: 'Tech & Tunes', prompt: 'Favorite 90s rock ballad?', duration: '0:25' },
    distance: '9 km away',
    zodiac: 'Gemini',
    height: "178 cm (5'10\")",
    education: 'B.Tech, DTU',
    is_verified: true,
    email: 'rohan.malhotra@cufy.app'
  },
  {
    id: 'male_4',
    name: 'Siddharth Roy',
    age: 25,
    gender: 'Man',
    city: 'Gurugram',
    activeStatus: 'Active today',
    intents: ['Serious relationship', 'Life partner'],
    photos: ['/photos/couple5.jpg', '/photos/couple4_opt.jpg'],
    bio: 'Architect & guitarist. Passionate about urban planning, dogs, and cozy acoustic jam sessions 🎸',
    promptQuestion: 'Ideal date idea',
    promptAnswer: 'Late night drive with warm chai and acoustic guitar on the rooftop.',
    voiceNote: { title: 'Chai & Guitar', prompt: 'What song brings you comfort?', duration: '0:20' },
    distance: '14 km away',
    zodiac: 'Capricorn',
    height: "180 cm (5'11\")",
    education: 'B.Arch, SPA Delhi',
    is_verified: true,
    email: 'siddharth.roy@cufy.app'
  }
];

// Helper: Normalize & Format profile data structure for feed components
export function formatProfileForFeed(p) {
  if (!p) return null;
  const isWoman = p.gender === 'Woman';
  
  let cleanPhotos = (p.photos && Array.isArray(p.photos) && p.photos.length > 0)
    ? p.photos.filter(u => typeof u === 'string' && u.length > 3)
    : [];
  
  if (cleanPhotos.length === 0) {
    if (p.photo) cleanPhotos = [p.photo];
    else if (isWoman) cleanPhotos = ['/photos/front1.jpg', '/photos/front2.jpg'];
    else cleanPhotos = ['/photos/couple4_opt.jpg', '/photos/couple3.jpg'];
  }

  const heightStr = p.height 
    ? p.height 
    : (p.heightFeet ? `${p.heightFeet}'${p.heightInches || 0}"` : (isWoman ? `5'5"` : `5'11"`));

  const promptQ = p.promptQuestion || p.prompt1 || (isWoman ? 'Ideal Sunday Morning' : 'I will know I found the one when');
  const promptA = p.promptAnswer || p.prompt1_answer || p.bio || (isWoman ? 'Matcha latte, vinyl records & quiet rain' : 'We can laugh endlessly over silly jokes');

  const voice = p.voiceNote || (p.voiceNoteUrl || p.voice_note_url ? {
    title: 'Voice Note',
    prompt: 'Listen to audio intro',
    duration: '0:18',
    audioUrl: p.voiceNoteUrl || p.voice_note_url
  } : null);

  const intentsList = Array.isArray(p.intents) 
    ? p.intents 
    : (p.intent ? [p.intent] : ['Serious relationship']);

  return {
    id: p.id || `usr_${p.email || Math.random()}`,
    name: p.name || (isWoman ? 'Ananya' : 'Aarav'),
    age: p.age || 24,
    gender: p.gender || (isWoman ? 'Woman' : 'Man'),
    city: p.city || p.location || 'Greater Noida',
    activeStatus: p.activeStatus || 'Active today',
    intents: intentsList,
    photos: cleanPhotos,
    voiceNote: voice,
    bio: p.bio || promptA,
    promptQuestion: promptQ,
    promptAnswer: promptA,
    distance: p.distance || '4 km away',
    zodiac: p.zodiac || p.religion || 'Spiritual',
    height: heightStr,
    education: p.education || p.college || 'University',
    email: p.email,
    is_verified: p.is_verified !== false
  };
}

// Master function: Select opposite-gender profiles for the logged-in user
export function getProfilesForUser(userProfile, registeredUsers = [], filters = null) {
  const userGender = userProfile?.gender || 'Man';
  const interestedIn = userProfile?.interested_in || (userGender === 'Man' ? 'Women' : 'Men');
  const userEmail = (userProfile?.email || '').toLowerCase().trim();
  const userId = userProfile?.id;

  // Determine target gender:
  // If user is Male -> target is 'Woman' (unless explicitly set interested_in === 'Men')
  // If user is Female -> target is 'Man' (unless explicitly set interested_in === 'Women')
  let targetGender = 'Woman';
  if (interestedIn === 'Women') {
    targetGender = 'Woman';
  } else if (interestedIn === 'Men') {
    targetGender = 'Man';
  } else if (interestedIn === 'Everyone') {
    targetGender = 'All';
  } else {
    targetGender = userGender === 'Man' ? 'Woman' : 'Man';
  }

  // 1. Filter real registered cloud/local users
  const realMatchedUsers = (registeredUsers || []).filter(u => {
    if (!u || u.isAdmin) return false;
    const uEmail = (u.email || '').toLowerCase().trim();
    if (userEmail && uEmail === userEmail) return false; // Exclude self
    if (userId && u.id === userId) return false; // Exclude self
    if (u.status === 'suspended' || u.status === 'deleted') return false;

    if (targetGender !== 'All' && u.gender) {
      if (targetGender === 'Woman' && u.gender !== 'Woman') return false;
      if (targetGender === 'Man' && u.gender !== 'Man') return false;
    }
    return true;
  });

  // 2. Select matching profiles: If real registered users exist, return ONLY real users!
  let combined = [];
  if (realMatchedUsers.length > 0) {
    combined = [...realMatchedUsers];
  } else {
    // Fallback curated profiles only if zero real registered users exist in DB
    let curatedList = [];
    if (targetGender === 'Woman') {
      curatedList = FEMALE_CURATED_PROFILES;
    } else if (targetGender === 'Man') {
      curatedList = MALE_CURATED_PROFILES;
    } else {
      curatedList = [...FEMALE_CURATED_PROFILES, ...MALE_CURATED_PROFILES];
    }
    combined = [...curatedList];
  }

  // 3. Format all profiles for feed
  let formatted = combined.map(formatProfileForFeed).filter(Boolean);

  // 4. Apply filter modal constraints if present
  if (filters) {
    if (filters.minAge || filters.maxAge) {
      const minA = filters.minAge || 18;
      const maxA = filters.maxAge || 99;
      formatted = formatted.filter(p => p.age >= minA && p.age <= maxA);
    }
    if (filters.verifiedOnly) {
      formatted = formatted.filter(p => p.is_verified);
    }
    if (filters.religion && filters.religion !== 'All') {
      formatted = formatted.filter(p => (p.zodiac || '').toLowerCase().includes(filters.religion.toLowerCase()));
    }
  }

  return formatted;
}

// Backwards compatibility exports
export const HOME_SWIPE_PROFILES = FEMALE_CURATED_PROFILES.map(formatProfileForFeed);
export const INITIAL_DAILY_MATCH = FEMALE_CURATED_PROFILES[0] ? formatProfileForFeed(FEMALE_CURATED_PROFILES[0]) : null;
export const EXPLORE_PROFILES = [...FEMALE_CURATED_PROFILES, ...MALE_CURATED_PROFILES].map(formatProfileForFeed);
