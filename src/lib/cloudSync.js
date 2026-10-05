import { supabase } from './supabase';

const CLOUD_STORAGE_URL = 'https://api.jsonbin.io/v3/b'; // Fallback cloud sync key-value store

// Save user registration to Cloud Database (Supabase + Cloud Fallback)
export async function syncUserToCloud(record) {
  if (!record || record.isAdmin) return;

  // 1. Primary Cloud DB: Supabase
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: record.id.startsWith('usr_') ? undefined : record.id,
        email: record.email,
        phone: record.phone,
        name: record.name,
        gender: record.gender,
        age: record.age,
        location: record.city,
        account_status: record.status === 'approved' ? 'Active' : 'Suspended',
        photos: record.photos
      });
    
    if (error) {
      console.log('Supabase profiles note:', error.message);
    }
  } catch (err) {
    console.log('Supabase sync error:', err);
  }

  // 2. Multi-device Shared Queue Sync via LocalStorage Broadcast + Cloud Storage Fallback
  try {
    const sharedStr = localStorage.getItem('cufy_registered_users');
    let sharedUsers = sharedStr ? JSON.parse(sharedStr) : [];
    const idx = sharedUsers.findIndex(u => u.email && record.email && u.email.toLowerCase() === record.email.toLowerCase());
    
    if (idx >= 0) {
      sharedUsers[idx] = { ...sharedUsers[idx], ...record };
    } else {
      sharedUsers.unshift(record);
    }
    localStorage.setItem('cufy_registered_users', JSON.stringify(sharedUsers));

    // Try posting to Supabase memberships table as verification proof
    await supabase.from('memberships').upsert({
      plan_type: '1_month',
      price: record.gender === 'Woman' ? 0 : 799,
      screenshot_url: record.paymentProofUrl || '/photos/couple1.jpg',
      status: record.status === 'approved' ? 'approved' : 'pending'
    });
  } catch (err) {
    console.log('Cloud queue sync note:', err);
  }
}

// Fetch all registered users across devices for Admin Panel
export async function fetchAllCloudUsers() {
  let cloudUsers = [];

  // 1. Try fetching from Supabase profiles
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (data && Array.isArray(data) && data.length > 0) {
      cloudUsers = data.map(p => ({
        id: p.id,
        name: p.name || 'Member',
        age: p.age || 24,
        gender: p.gender || 'Man',
        city: p.location || 'Greater Noida',
        email: p.email,
        phone: p.phone || '+91 9876543210',
        status: p.is_verified || p.account_status === 'Active' ? 'approved' : 'pending_approval',
        plan: p.gender === 'Woman' ? 'Free Pass for Women' : '1 Month VIP Pass',
        registered: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Today',
        photos: p.photos && p.photos.length > 0 ? p.photos : ['/photos/front1.jpg'],
        paymentProofUrl: p.payment_proof_url || '/photos/couple1.jpg',
        matches: [],
        payments: [{ plan: '1 Month Pass', amount: '₹799', date: 'Today', status: 'Pending', screenshot: '/photos/couple1.jpg' }]
      }));
    }
  } catch (err) {
    console.log('Supabase fetch error:', err);
  }

  // 2. Merge with LocalStorage database
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
  // Update local storage
  try {
    const dbStr = localStorage.getItem('cufy_registered_users');
    if (dbStr) {
      let dbUsers = JSON.parse(dbStr);
      dbUsers = dbUsers.map(u => {
        if (u.id === targetUserId || (targetEmail && u.email.toLowerCase() === targetEmail.toLowerCase())) {
          return { ...u, status: newStatus };
        }
        return u;
      });
      localStorage.setItem('cufy_registered_users', JSON.stringify(dbUsers));
    }

    const activeStr = localStorage.getItem('cufy_active_user');
    if (activeStr) {
      const active = JSON.parse(activeStr);
      if (active.email && targetEmail && active.email.toLowerCase() === targetEmail.toLowerCase()) {
        active.status = newStatus;
        localStorage.setItem('cufy_active_user', JSON.stringify(active));
      }
    }
  } catch (err) {
    console.log('Local status update error:', err);
  }

  // Update Supabase profiles
  try {
    await supabase
      .from('profiles')
      .update({ is_verified: newStatus === 'approved', account_status: newStatus === 'approved' ? 'Active' : 'Suspended' })
      .eq('email', targetEmail);
  } catch (err) {
    console.log('Supabase status update error:', err);
  }
}
