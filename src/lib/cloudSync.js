import { supabase } from './supabase';

const REST_CLOUD_API = 'https://api.restful-api.dev/objects';

// Helper: Get plan duration in days
export function getPlanDurationDays(plan) {
  if (!plan) return 30;
  const p = plan.toString().toLowerCase();
  if (p.includes('1_day') || p.includes('1 day') || p.includes('day_199')) return 1;
  if (p.includes('1_week') || p.includes('1 week') || p.includes('week_299')) return 7;
  if (p.includes('15_days') || p.includes('15 days') || p.includes('days15_499') || p.includes('15_day')) return 15;
  if (p.includes('1_month') || p.includes('1 month') || p.includes('month_799') || p.includes('vip') || p.includes('month')) return 30;
  if (p.includes('women') || p.includes('free')) return 365;
  return 30;
}

// Helper: Format readable plan name
export function formatPlanName(plan) {
  if (!plan) return '1 Month VIP Pass';
  const p = plan.toString().toLowerCase();
  if (p.includes('1_day') || p.includes('1 day') || p.includes('day_199')) return '1 Day Pass';
  if (p.includes('1_week') || p.includes('1 week') || p.includes('week_299')) return '1 Week Pass';
  if (p.includes('15_days') || p.includes('15 days') || p.includes('days15_499')) return '15 Days Pass';
  if (p.includes('1_month') || p.includes('1 month') || p.includes('month_799') || p.includes('vip')) return '1 Month VIP Pass';
  if (p.includes('women') || p.includes('free')) return 'Free Pass for Women';
  return plan;
}

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

// Ensure email is valid for Supabase Auth requirements
function sanitizeEmail(email) {
  let clean = (email || '').toLowerCase().trim();
  if (!clean) return 'user_' + Date.now() + '@gmail.com';
  if (!clean.includes('@')) clean += '@gmail.com';
  if (clean.endsWith('@cufy.app') || clean.endsWith('.local')) {
    clean = clean.split('@')[0] + '@gmail.com';
  }
  return clean;
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

  const rawEmail = (record.email || '').toLowerCase().trim();
  if (!rawEmail) return;
  const userEmail = sanitizeEmail(rawEmail);
  const planDays = record.planDays || getPlanDurationDays(record.plan);
  const planName = formatPlanName(record.plan || (record.gender === 'Woman' ? 'Free Pass for Women' : '1 Month VIP Pass'));

  const syncPayload = {
    id: record.id || `usr_${Date.now()}`,
    name: record.name || 'Member',
    age: record.age || 24,
    gender: record.gender || 'Man',
    city: record.city || 'Greater Noida',
    email: userEmail,
    phone: record.phone || '+91 9876543210',
    status: record.status || 'pending_approval',
    is_verified: record.status === 'approved',
    plan: planName,
    planDays: planDays,
    startsAt: record.startsAt || null,
    expiresAt: record.expiresAt || null,
    registered: record.registered || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    photos: (record.photos && record.photos.filter(p => Boolean(p)).length > 0) ? record.photos : ['/photos/front1.jpg'],
    paymentProofUrl: record.paymentProofUrl || record.paymentProof || '/photos/couple1.jpg',
    matches: record.matches || [],
    payments: record.payments || [{
      plan: planName,
      amount: record.gender === 'Woman' ? '₹0 FREE' : (record.planPrice ? `₹${record.planPrice}` : '₹799'),
      date: 'Today',
      status: record.status === 'approved' ? 'Approved' : 'Pending',
      screenshot: record.paymentProofUrl || record.paymentProof || '/photos/couple1.jpg'
    }]
  };

  // 1. Save to LocalStorage
  try {
    const dbStr = localStorage.getItem('cufy_registered_users');
    let dbUsers = dbStr ? JSON.parse(dbStr) : [];
    const idx = dbUsers.findIndex(u => u.email && (u.email.toLowerCase() === userEmail || u.email.toLowerCase() === rawEmail));
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

  // 3. Multi-Device Cloud DB Relay
  try {
    await fetch(REST_CLOUD_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `cufy_user_${userEmail}`,
        data: syncPayload
      })
    });
  } catch (cloudErr) {
    console.log('Cloud relay note:', cloudErr);
  }

  // 4. Supabase Database Sync
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
      } else {
        const { data: signInRes } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: 'CufyPass123!#'
        });
        if (signInRes?.user?.id) {
          authUserId = signInRes.user.id;
        }
      }
    } catch (aErr) {}

    const targetUuid = authUserId || (record.id && record.id.length === 36 ? record.id : generateUUID());

    await supabase
      .from('profiles')
      .upsert({
        id: targetUuid,
        email: userEmail,
        phone: syncPayload.phone,
        name: syncPayload.name,
        gender: syncPayload.gender,
        age: syncPayload.age,
        location: syncPayload.city,
        account_status: syncPayload.status === 'suspended' ? 'Suspended' : 'Active',
        is_verified: syncPayload.status === 'approved',
        photos: syncPayload.photos
      }, { onConflict: 'email' });

    // Memberships Table
    const { data: prof } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();

    if (prof?.id) {
      let dbPlanType = '1_month';
      const pl = (syncPayload.plan || '').toLowerCase();
      if (syncPayload.gender === 'Woman') dbPlanType = 'free_women';
      else if (pl.includes('1_day') || pl.includes('1 day')) dbPlanType = '1_day';
      else if (pl.includes('1_week') || pl.includes('1 week')) dbPlanType = '1_week';
      else if (pl.includes('15_days') || pl.includes('15 days')) dbPlanType = '15_days';
      else dbPlanType = '1_month';

      await supabase
        .from('memberships')
        .upsert({
          user_id: prof.id,
          plan_type: dbPlanType,
          price: syncPayload.gender === 'Woman' ? 0 : (record.planPrice || 799),
          screenshot_url: syncPayload.paymentProofUrl,
          status: syncPayload.status === 'approved' ? 'approved' : 'pending',
          starts_at: syncPayload.startsAt || null,
          expires_at: syncPayload.expiresAt || null
        }, { onConflict: 'user_id' });
    }
  } catch (err) {
    console.log('Supabase sync note:', err);
  }
}

// Fetch all registered users across devices for Admin Panel
export async function fetchAllCloudUsers() {
  let cloudUsers = [];

  // Source A: Guaranteed Cloud DB Relay
  try {
    const res = await fetch(REST_CLOUD_API);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        list.forEach(item => {
          if (item && item.name && item.name.startsWith('cufy_user_') && item.data && item.data.email) {
            cloudUsers.push(item.data);
          }
        });
      }
    }
  } catch (err) {
    console.log('Cloud relay fetch note:', err);
  }

  // Source B: Supabase `profiles` + `memberships` (Primary Source of Truth)
  try {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: memberships } = await supabase.from('memberships').select('*');

    if (profiles && Array.isArray(profiles) && profiles.length > 0) {
      profiles.forEach(p => {
        if (!p.email || p.email === 'cupid.livepro@gmail.com') return;
        const cleanEmail = p.email.toLowerCase().trim();
        const mem = memberships ? memberships.find(m => m.user_id === p.id) : null;
        
        const existingIdx = cloudUsers.findIndex(cu => cu.email && cu.email.toLowerCase() === cleanEmail);
        const existing = existingIdx >= 0 ? cloudUsers[existingIdx] : null;
        const proof = mem?.screenshot_url || existing?.paymentProofUrl || existing?.paymentProof || '/photos/couple1.jpg';

        // STRICT VERIFICATION CHECK:
        // Must be verified in profile OR approved in memberships. account_status defaults to Active and does NOT mean approved!
        const isVerified = Boolean(p.is_verified || (mem && mem.status === 'approved'));

        // Expiration check
        const now = new Date();
        const startsAt = mem?.starts_at || existing?.startsAt || null;
        const expiresAt = mem?.expires_at || existing?.expiresAt || null;
        let isExpired = false;
        if (expiresAt && new Date(expiresAt) <= now) {
          isExpired = true;
        }

        let userStatus = 'pending_approval';
        if (p.account_status === 'Suspended') {
          userStatus = 'suspended';
        } else if (isExpired) {
          userStatus = 'expired';
        } else if (isVerified) {
          userStatus = 'approved';
        } else {
          userStatus = 'pending_approval';
        }

        const rawPlan = mem?.plan_type || existing?.plan || (p.gender === 'Woman' ? 'free_women' : '1_month');
        const planName = formatPlanName(rawPlan);
        const planDays = getPlanDurationDays(rawPlan);

        const mapped = {
          id: p.id,
          name: p.name || existing?.name || 'Member',
          age: p.age || existing?.age || 24,
          gender: p.gender || existing?.gender || 'Man',
          city: p.location || existing?.city || 'Greater Noida',
          email: p.email,
          phone: p.phone || existing?.phone || '+91 9876543210',
          status: userStatus,
          is_verified: isVerified,
          plan: planName,
          planDays: planDays,
          startsAt: startsAt,
          expiresAt: expiresAt,
          registered: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : (existing?.registered || 'Today'),
          photos: (p.photos && p.photos.length > 0) ? p.photos : (existing?.photos || ['/photos/front1.jpg']),
          paymentProofUrl: proof,
          matches: existing?.matches || [],
          payments: [{
            plan: planName,
            amount: p.gender === 'Woman' ? '₹0 FREE' : (mem?.price ? `₹${mem.price}` : '₹799'),
            date: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Today',
            status: isVerified ? 'Approved' : 'Pending',
            screenshot: proof
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
    console.log('Supabase fetch note:', err);
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
    console.log('Local merge note:', err);
  }

  return cloudUsers;
}

// Update User Approval Status across Cloud, Supabase & LocalStorage
export async function updateCloudUserStatus(targetUserId, targetEmail, newStatus, options = {}) {
  const cleanEmail = sanitizeEmail(targetEmail);
  const now = new Date();

  let startsAt = options.startsAt || null;
  let expiresAt = options.expiresAt || null;
  const durationDays = options.planDays || getPlanDurationDays(options.planName || '1 Month VIP Pass');

  if (newStatus === 'approved') {
    startsAt = startsAt || now.toISOString();
    if (!expiresAt) {
      expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  // 1. Update in Cloud DB Relay
  try {
    const res = await fetch(REST_CLOUD_API);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        const matched = list.find(item => item.name === `cufy_user_${cleanEmail}` || (item.data && item.data.email && item.data.email.toLowerCase() === cleanEmail));
        if (matched) {
          matched.data.status = newStatus;
          matched.data.is_verified = newStatus === 'approved';
          matched.data.startsAt = startsAt;
          matched.data.expiresAt = expiresAt;
          matched.data.planDays = durationDays;
          await fetch(`${REST_CLOUD_API}/${matched.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matched)
          });
        }
      }
    }
  } catch (e) {
    console.log('Cloud status update note:', e);
  }

  // 2. Update in Supabase profiles
  try {
    await supabase
      .from('profiles')
      .update({
        is_verified: newStatus === 'approved',
        account_status: newStatus === 'suspended' ? 'Suspended' : 'Active',
        updated_at: now.toISOString()
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
      const updatePayload = {
        status: newStatus === 'approved' ? 'approved' : (newStatus === 'rejected' ? 'rejected' : (newStatus === 'expired' ? 'expired' : 'pending'))
      };
      if (startsAt) updatePayload.starts_at = startsAt;
      if (expiresAt) updatePayload.expires_at = expiresAt;

      await supabase
        .from('memberships')
        .update(updatePayload)
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
          return {
            ...u,
            status: newStatus,
            is_verified: newStatus === 'approved',
            startsAt: startsAt || u.startsAt,
            expiresAt: expiresAt || u.expiresAt,
            planDays: durationDays
          };
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
        active.is_verified = newStatus === 'approved';
        active.startsAt = startsAt || active.startsAt;
        active.expiresAt = expiresAt || active.expiresAt;
        active.planDays = durationDays;
        localStorage.setItem('cufy_active_user', JSON.stringify(active));
      }
    }
  } catch (err) {
    console.log('Local status update error:', err);
  }

  // 5. Broadcast to other tabs & window
  if (syncChannel) {
    try {
      syncChannel.postMessage({
        type: 'USER_STATUS_UPDATED',
        email: cleanEmail,
        status: newStatus,
        startsAt,
        expiresAt,
        planDays: durationDays
      });
    } catch (e) {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cufy_user_approved', {
      detail: { email: cleanEmail, status: newStatus, startsAt, expiresAt, planDays: durationDays }
    }));
  }
}

// Backfill all existing registered users + Admin into Supabase Auth & Profiles
export async function backfillAllUsersToSupabase() {
  const users = await fetchAllCloudUsers();
  
  const adminAccount = {
    name: 'Admin',
    email: 'cupid.livepro@gmail.com',
    gender: 'Man',
    status: 'approved',
    is_verified: true,
    isAdmin: true
  };

  const listToSync = [...users];
  if (!listToSync.some(u => u.email && u.email.toLowerCase() === 'cupid.livepro@gmail.com')) {
    listToSync.push(adminAccount);
  }

  let successCount = 0;
  for (const user of listToSync) {
    const rawEmail = (user.email || '').toLowerCase().trim();
    if (!rawEmail) continue;
    const cleanEmail = sanitizeEmail(rawEmail);
    const userPass = cleanEmail === 'cupid.livepro@gmail.com' ? 'cUpid.livepro#@3210' : 'CufyPass123!#';

    try {
      // 1. Supabase Auth
      let authId = null;
      try {
        const { data: signUpRes } = await supabase.auth.signUp({
          email: cleanEmail,
          password: userPass,
          options: { data: { name: user.name || 'Member' } }
        });
        if (signUpRes?.user?.id) {
          authId = signUpRes.user.id;
        }
      } catch (e) {}

      if (!authId) {
        const { data: signInRes } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: userPass
        });
        if (signInRes?.user?.id) {
          authId = signInRes.user.id;
        }
      }

      // 2. Upsert in Profiles Table
      const targetUuid = authId || (user.id && user.id.length === 36 ? user.id : generateUUID());
      const isApproved = Boolean(user.status === 'approved' || user.is_verified);

      await supabase
        .from('profiles')
        .upsert({
          id: targetUuid,
          email: cleanEmail,
          phone: user.phone || '+91 9876543210',
          name: user.name || 'Member',
          gender: user.gender || 'Man',
          age: user.age || 24,
          location: user.city || 'Greater Noida',
          account_status: user.status === 'suspended' ? 'Suspended' : 'Active',
          is_verified: isApproved,
          photos: user.photos || ['/photos/front1.jpg'],
          is_admin: Boolean(user.isAdmin)
        }, { onConflict: 'email' });

      successCount++;
    } catch (err) {
      console.log('Backfill error for', cleanEmail, err);
    }
  }

  return successCount;
}
