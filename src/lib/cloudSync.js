import { supabase } from './supabase';

const CLOUD_KV_BUCKET = 'cufy_v1_sync_bucket_2026';
const CLOUD_KV_URL = `https://kvdb.io/${CLOUD_KV_BUCKET}`;

// Generate valid RFC4122 UUID v4 for Supabase compatibility
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// In-Memory & LocalStorage Multi-Device Broadcast Channel
const BROADCAST_CHANNEL_NAME = 'cufy_global_sync_v1';
let syncChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {}
}

// Save & Broadcast User Registration across all devices globally
export async function syncUserToCloud(record) {
  if (!record || record.isAdmin) return;

  const userEmail = (record.email || '').toLowerCase().trim();
  if (!userEmail) return;

  const keyId = encodeURIComponent(userEmail.replace(/[^a-zA-Z0-9]/g, '_'));

  const syncPayload = {
    id: record.id || `usr_${Date.now()}`,
    name: record.name || 'Member',
    age: record.age || 24,
    gender: record.gender || 'Man',
    city: record.city || 'Greater Noida',
    email: userEmail,
    phone: record.phone || '+91 9876543210',
    status: record.status || (record.gender === 'Woman' ? 'approved' : 'pending_approval'),
    plan: record.plan || (record.gender === 'Woman' ? 'Free Pass for Women' : '1 Month VIP Pass'),
    registered: record.registered || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    photos: (record.photos && record.photos.filter(p => Boolean(p)).length > 0) ? record.photos : ['/photos/front1.jpg'],
    paymentProofUrl: record.paymentProofUrl || record.paymentProof || '/photos/couple1.jpg',
    matches: record.matches || [],
    payments: record.payments || [{ plan: record.plan || '1 Month Pass', amount: '₹799', date: 'Today', status: record.status === 'approved' ? 'Approved' : 'Pending', screenshot: record.paymentProofUrl || '/photos/couple1.jpg' }]
  };

  // 1. Save to LocalStorage
  try {
    const dbStr = localStorage.getItem('cufy_registered_users');
    let dbUsers = dbStr ? JSON.parse(dbStr) : [];
    const idx = dbUsers.findIndex(u => u.email && u.email.toLowerCase() === userEmail);
    if (idx >= 0) {
      dbUsers[idx] = { ...dbUsers[idx], ...syncPayload };
    } else {
      dbUsers.unshift(syncPayload);
    }
    localStorage.setItem('cufy_registered_users', JSON.stringify(dbUsers));
  } catch (e) {}

  // 2. Broadcast to open tabs / PWA instances
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'USER_REGISTERED', payload: syncPayload });
    } catch (e) {}
  }

  // 3. Cloud KV Storage Relay (Zero-Auth Multi-Device Cross-Phone Sync)
  try {
    await fetch(`${CLOUD_KV_URL}/${keyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncPayload)
    });
  } catch (kvErr) {
    console.log('Cloud KV note:', kvErr);
  }

  // 4. Primary Supabase Database Sync with Auth fallback
  try {
    let authUserId = null;
    try {
      const { data: signUpRes } = await supabase.auth.signUp({
        email: userEmail,
        password: 'CufyPass123!#',
        options: { data: { name: syncPayload.name } }
      });
      if (signUpRes?.user?.id) {
        authUserId = signUpRes.user.id;
      }
    } catch (aErr) {}

    const targetUuid = authUserId || (record.id && record.id.length === 36 ? record.id : generateUUID());

    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: targetUuid,
        email: userEmail,
        phone: syncPayload.phone,
        name: syncPayload.name,
        gender: syncPayload.gender,
        age: syncPayload.age,
        location: syncPayload.city,
        account_status: syncPayload.status === 'approved' ? 'Active' : 'Suspended',
        is_verified: syncPayload.status === 'approved',
        photos: syncPayload.photos
      }, { onConflict: 'email' });

    if (profileErr) {
      console.log('Supabase profile note:', profileErr.message);
    }

    // Memberships Table
    const { data: prof } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();

    if (prof?.id) {
      await supabase
        .from('memberships')
        .upsert({
          user_id: prof.id,
          plan_type: syncPayload.gender === 'Woman' ? 'free_women' : '1_month',
          price: syncPayload.gender === 'Woman' ? 0 : 799,
          screenshot_url: syncPayload.paymentProofUrl,
          status: syncPayload.status === 'approved' ? 'approved' : 'pending'
        });
    }
  } catch (err) {
    console.log('Supabase sync error:', err);
  }
}

// Fetch all registered users across devices for Admin Panel
export async function fetchAllCloudUsers() {
  let cloudUsers = [];

  // Source A: Cloud KV Storage (Instant Multi-Device Cross-Phone Sync)
  try {
    const res = await fetch(`${CLOUD_KV_URL}?values=true`);
    if (res.ok) {
      const kvData = await res.json();
      if (Array.isArray(kvData)) {
        kvData.forEach(item => {
          const val = Array.isArray(item) ? item[1] : item;
          if (val && typeof val === 'object' && val.email) {
            cloudUsers.push(val);
          } else if (typeof val === 'string') {
            try {
              const parsed = JSON.parse(val);
              if (parsed && parsed.email) cloudUsers.push(parsed);
            } catch (e) {}
          }
        });
      }
    }
  } catch (err) {
    console.log('Cloud KV fetch note:', err);
  }

  // Source B: Supabase `profiles` + `memberships`
  try {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: memberships } = await supabase.from('memberships').select('*');

    if (profiles && Array.isArray(profiles) && profiles.length > 0) {
      profiles.forEach(p => {
        if (!p.email || p.email === 'cupid.livepro@gmail.com') return;
        const mem = memberships ? memberships.find(m => m.user_id === p.id) : null;
        
        const existingIdx = cloudUsers.findIndex(u => u.email && u.email.toLowerCase() === p.email.toLowerCase());
        const mapped = {
          id: p.id,
          name: p.name || 'Member',
          age: p.age || 24,
          gender: p.gender || 'Man',
          city: p.location || 'Greater Noida',
          email: p.email,
          phone: p.phone || '+91 9876543210',
          status: p.is_verified || p.account_status === 'Active' ? 'approved' : 'pending_approval',
          plan: p.gender === 'Woman' ? 'Free Pass for Women' : '1 Month VIP Pass',
          registered: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Today',
          photos: p.photos && p.photos.length > 0 ? p.photos : ['/photos/front1.jpg'],
          paymentProofUrl: mem?.screenshot_url || '/photos/couple1.jpg',
          matches: [],
          payments: [{
            plan: p.gender === 'Woman' ? 'Free Pass' : '1 Month Pass',
            amount: p.gender === 'Woman' ? '₹0' : '₹799',
            date: 'Today',
            status: p.is_verified ? 'Approved' : 'Pending',
            screenshot: mem?.screenshot_url || '/photos/couple1.jpg'
          }]
        };

        if (existingIdx >= 0) {
          cloudUsers[existingIdx] = { ...cloudUsers[existingIdx], ...mapped };
        } else {
          cloudUsers.push(mapped);
        }
      });
    }
  } catch (err) {
    console.log('Supabase fetch error:', err);
  }

  // Source C: LocalStorage database
  try {
    const localStr = localStorage.getItem('cufy_registered_users');
    if (localStr) {
      const localUsers = JSON.parse(localStr);
      localUsers.forEach(lu => {
        if (!cloudUsers.some(cu => cu.email && lu.email && cu.email.toLowerCase() === lu.email.toLowerCase())) {
          cloudUsers.unshift(lu);
        }
      });
    }
  } catch (err) {
    console.log('Local merge error:', err);
  }

  return cloudUsers;
}

// Update User Approval Status across Cloud & Local
export async function updateCloudUserStatus(targetUserId, targetEmail, newStatus) {
  const cleanEmail = (targetEmail || '').toLowerCase().trim();
  if (!cleanEmail) return;

  const keyId = encodeURIComponent(cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'));

  // 1. Update in Cloud KV Storage
  try {
    const res = await fetch(`${CLOUD_KV_URL}/${keyId}`);
    if (res.ok) {
      const val = await res.json();
      if (val && typeof val === 'object') {
        val.status = newStatus;
        await fetch(`${CLOUD_KV_URL}/${keyId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(val)
        });
      }
    }
  } catch (e) {
    console.log('Cloud KV update note:', e);
  }

  // 2. Update in Supabase profiles
  try {
    await supabase
      .from('profiles')
      .update({
        is_verified: newStatus === 'approved',
        account_status: newStatus === 'approved' ? 'Active' : 'Suspended'
      })
      .eq('email', cleanEmail);
  } catch (err) {
    console.log('Supabase profile update error:', err);
  }

  // 3. Update in Supabase memberships
  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (prof?.id) {
      await supabase
        .from('memberships')
        .update({ status: newStatus })
        .eq('user_id', prof.id);
    }
  } catch (err) {
    console.log('Supabase membership update error:', err);
  }

  // 4. Update in local storage
  try {
    const dbStr = localStorage.getItem('cufy_registered_users');
    if (dbStr) {
      let dbUsers = JSON.parse(dbStr);
      dbUsers = dbUsers.map(u => {
        if (u.id === targetUserId || (u.email && u.email.toLowerCase() === cleanEmail)) {
          return { ...u, status: newStatus };
        }
        return u;
      });
      localStorage.setItem('cufy_registered_users', JSON.stringify(dbUsers));
    }

    const activeStr = localStorage.getItem('cufy_active_user');
    if (activeStr) {
      const active = JSON.parse(activeStr);
      if (active.email && active.email.toLowerCase() === cleanEmail) {
        active.status = newStatus;
        localStorage.setItem('cufy_active_user', JSON.stringify(active));
      }
    }
  } catch (err) {
    console.log('Local status update error:', err);
  }

  // 5. Broadcast to other tabs
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'USER_STATUS_UPDATED', email: cleanEmail, status: newStatus });
    } catch (e) {}
  }
}

