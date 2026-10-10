import { supabase } from '../lib/supabase';
import { formatProfileForFeed } from '../data/mockProfiles';

const BROADCAST_CHANNEL_NAME = 'cufy_global_sync_v1';
let syncChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {}
}

function getSanitizedEmail(email) {
  return (email || 'anonymous').toLowerCase().trim();
}

function getLikesSentKey(email) {
  return `cufy_likes_sent_${getSanitizedEmail(email)}`;
}

function getLikesReceivedKey(email) {
  return `cufy_likes_received_${getSanitizedEmail(email)}`;
}

// Get profiles liked by this user (EMPTY [] by default for new users!)
export function getSentLikes(userProfile) {
  if (!userProfile?.email) return [];
  try {
    const key = getLikesSentKey(userProfile.email);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Get profiles that liked this user (EMPTY [] by default for new users!)
export function getReceivedLikes(userProfile) {
  if (!userProfile?.email) return [];
  try {
    const key = getLikesReceivedKey(userProfile.email);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Record a new like (Sent by currentUser -> targetProfile)
export async function recordUserLike(currentUser, targetProfile, isSuperlike = false) {
  if (!currentUser?.email || !targetProfile) return { isMatch: false };

  const senderEmail = getSanitizedEmail(currentUser.email);
  const receiverEmail = targetProfile.email ? getSanitizedEmail(targetProfile.email) : null;
  const targetId = String(targetProfile.id || targetProfile.name).toLowerCase();
  const currentUserId = String(currentUser.id || currentUser.name).toLowerCase();

  // 1. Save to sender's "You Liked" storage
  try {
    const sentKey = getLikesSentKey(senderEmail);
    const existingSent = getSentLikes(currentUser);
    if (!existingSent.some(p => String(p.id || p.name).toLowerCase() === targetId)) {
      const sanitizedTarget = formatProfileForFeed(targetProfile) || targetProfile;
      const updatedSent = [sanitizedTarget, ...existingSent];
      localStorage.setItem(sentKey, JSON.stringify(updatedSent));
    }
  } catch (err) {
    console.warn('Error saving sent like:', err);
  }

  // 2. Save to receiver's "Likes You" storage
  if (receiverEmail) {
    try {
      const recvKey = getLikesReceivedKey(receiverEmail);
      const rawRecv = localStorage.getItem(recvKey);
      const existingRecv = rawRecv ? JSON.parse(rawRecv) : [];
      if (!existingRecv.some(p => String(p.id || p.name).toLowerCase() === currentUserId)) {
        const publicSenderProfile = {
          id: currentUser.id || `usr_${Date.now()}`,
          name: currentUser.name || 'Member',
          age: currentUser.age || 24,
          gender: currentUser.gender || 'Man',
          city: currentUser.city || currentUser.location || 'Greater Noida',
          photos: (currentUser.photos && currentUser.photos.length > 0) ? currentUser.photos : (currentUser.photo ? [currentUser.photo] : ['/photos/front1.jpg']),
          bio: currentUser.bio || '',
          promptQuestion: currentUser.promptQuestion || currentUser.prompt1 || 'Ideal Sunday Morning',
          promptAnswer: currentUser.promptAnswer || currentUser.prompt1Answer || '',
          education: currentUser.education || currentUser.college || '',
          jobTitle: currentUser.jobTitle || currentUser.occupation || '',
          height: currentUser.height || "5'5\"",
          religion: currentUser.religion || 'Spiritual',
          email: currentUser.email,
          is_cufy_like: Boolean(isSuperlike),
          is_superlike: Boolean(isSuperlike),
          liked_at: Date.now()
        };
        // Always place Cufy Likes right at the front of the receiver's list
        const updatedRecv = isSuperlike 
          ? [publicSenderProfile, ...existingRecv]
          : [...existingRecv, publicSenderProfile];
        localStorage.setItem(recvKey, JSON.stringify(updatedRecv));
      }
    } catch (err) {
      console.warn('Error saving received like for target:', err);
    }
  }

  // 3. Supabase Database Sync if connected
  if (supabase && currentUser.id && targetProfile.id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(currentUser.id) && uuidRegex.test(targetProfile.id)) {
      try {
        await supabase.from('likes').upsert({
          sender_id: currentUser.id,
          receiver_id: targetProfile.id,
          is_superlike: isSuperlike
        }, { onConflict: 'sender_id,receiver_id' });
      } catch (sbErr) {
        console.warn('Supabase like error note:', sbErr);
      }
    }
  }

  // 4. Multi-tab / multi-device BroadcastChannel notification
  if (syncChannel && receiverEmail) {
    try {
      syncChannel.postMessage({
        type: 'CUFY_LIKE_SENT',
        senderEmail,
        receiverEmail,
        senderProfile: currentUser
      });
    } catch (bcErr) {}
  }

  // 5. Check if mutual match: did targetProfile already like currentUser?
  const receivedLikes = getReceivedLikes(currentUser);
  const isMutual = receivedLikes.some(p => String(p.id || p.name).toLowerCase() === targetId);

  return { isMatch: isMutual };
}

// Fetch real likes from Supabase (or fallback to local)
export async function syncLikesFromCloud(userProfile) {
  if (!userProfile?.email) return { sent: [], received: [] };

  const localSent = getSentLikes(userProfile);
  const localReceived = getReceivedLikes(userProfile);

  if (!supabase || !userProfile.id) {
    return { sent: localSent, received: localReceived };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userProfile.id)) {
    return { sent: localSent, received: localReceived };
  }

  try {
    // 1. Fetch likes received by user
    const { data: dbRecv, error: errRecv } = await supabase
      .from('likes')
      .select('sender_id, profiles!likes_sender_id_fkey(*)')
      .eq('receiver_id', userProfile.id);

    let finalRecv = localReceived;
    if (!errRecv && Array.isArray(dbRecv)) {
      const parsedCloudRecv = dbRecv
        .map(row => row.profiles)
        .filter(Boolean)
        .map(formatProfileForFeed);
      
      // Merge unique
      const mergedMap = new Map();
      parsedCloudRecv.forEach(p => mergedMap.set(String(p.id || p.name).toLowerCase(), p));
      localReceived.forEach(p => mergedMap.set(String(p.id || p.name).toLowerCase(), p));
      finalRecv = Array.from(mergedMap.values());
      localStorage.setItem(getLikesReceivedKey(userProfile.email), JSON.stringify(finalRecv));
    }

    // 2. Fetch likes sent by user
    const { data: dbSent, error: errSent } = await supabase
      .from('likes')
      .select('receiver_id, profiles!likes_receiver_id_fkey(*)')
      .eq('sender_id', userProfile.id);

    let finalSent = localSent;
    if (!errSent && Array.isArray(dbSent)) {
      const parsedCloudSent = dbSent
        .map(row => row.profiles)
        .filter(Boolean)
        .map(formatProfileForFeed);

      const mergedSentMap = new Map();
      parsedCloudSent.forEach(p => mergedSentMap.set(String(p.id || p.name).toLowerCase(), p));
      localSent.forEach(p => mergedSentMap.set(String(p.id || p.name).toLowerCase(), p));
      finalSent = Array.from(mergedSentMap.values());
      localStorage.setItem(getLikesSentKey(userProfile.email), JSON.stringify(finalSent));
    }

    return { sent: finalSent, received: finalRecv };
  } catch (e) {
    console.warn('Sync likes cloud fallback:', e);
    return { sent: localSent, received: localReceived };
  }
}
