import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ShieldCheck, CheckCircle2, XCircle, Users, Heart, CreditCard, 
  LogOut, ChevronRight, Eye, UserX, AlertCircle, RefreshCw, 
  Phone, Mail, MapPin, Sparkles, Camera, Zap, Check, X, 
  UploadCloud, Clock, Calendar, TrendingUp, DollarSign, Bell,
  Trash2, ShieldAlert, ArrowUpRight, CheckCheck, MessageSquare, AlertTriangle,
  Search, CheckCircle, ExternalLink
} from 'lucide-react';
import { ENV } from '../../config/env';
import { 
  fetchAllCloudUsers, 
  updateCloudUserStatus, 
  backfillAllUsersToSupabase, 
  getPlanDurationDays, 
  formatPlanName,
  getSimplifiedPlanBadge
} from '../../lib/cloudSync';
import { supabase } from '../../lib/supabase';

function formatRemainingTime(expiresAt) {
  if (!expiresAt) return null;
  const now = new Date();
  const exp = new Date(expiresAt);
  const diff = exp - now;
  if (diff <= 0) return { expired: true, text: 'Expired' };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return { expired: false, text: `${days}d ${hours}h left`, days, hours };
  if (hours > 0) return { expired: false, text: `${hours}h ${mins}m left`, days: 0, hours };
  return { expired: false, text: `${mins}m left`, days: 0, hours: 0 };
}

// Gentle pleasant audio chime on new registration
function playNewEntryChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    
    // Two-tone chime (D5 -> A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio context may be restricted by browser policy
  }
}

// Predefined Rejection Reasons
const REJECTION_REASONS = [
  {
    id: 'payment_invalid',
    title: 'Payment Screenshot Invalid or Amount Mismatch',
    desc: 'Payment receipt is unclear, forged, cropped, or does not match the required plan amount.'
  },
  {
    id: 'photos_fake',
    title: 'Fake, Blurry, or Inappropriate Photos',
    desc: 'Uploaded photos appear downloaded, blurred, fake, or violate safety guidelines.'
  },
  {
    id: 'profile_wrong',
    title: 'Invalid or Incomplete Profile Details',
    desc: 'Profile name, bio, or questionnaire answers contain improper or misleading information.'
  },
  {
    id: 'contact_invalid',
    title: 'Invalid Phone Number or Email Address',
    desc: 'Provided contact phone number or email address is invalid or could not be reached.'
  },
  {
    id: 'suspicious_account',
    title: 'Suspicious Profile / Impersonation Risk',
    desc: 'Account flagged for suspicious activity, bot behavior, or potential identity impersonation.'
  },
  {
    id: 'custom',
    title: 'Custom Reason',
    desc: 'Specify a personalized explanation for the member.'
  }
];

// Helper: Real User DP Avatar (with initials fallback, never stock couple photos)
function UserAvatar({ user, size = 46, onClick }) {
  const [imgError, setImgError] = useState(false);
  const photo = user?.photos?.[0] || user?.photo;
  const initials = (user?.name || user?.userName || 'Member')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div 
      onClick={onClick}
      title={onClick ? "Click to inspect profile" : undefined}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.round(size * 0.32)}px`,
        overflow: 'hidden',
        border: '1.5px solid #09090B',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        background: 'linear-gradient(135deg, #18181B 0%, #27272A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontWeight: 900,
        fontSize: `${size * 0.35}px`,
        letterSpacing: '0.5px'
      }}
    >
      {photo && !imgError ? (
        <img 
          src={photo} 
          alt={user?.name || user?.userName || 'DP'} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(9,9,11,0.72)', color: '#FFFFFF',
        fontSize: '0.52rem', fontWeight: 800, textAlign: 'center', padding: '1px 0'
      }}>
        DP
      </div>
    </div>
  );
}

// Helper: Payment Screenshot Thumbnail (with preview, zoom click, and free/missing status)
function ScreenshotThumbnail({ pay, onClick }) {
  const [imgError, setImgError] = useState(false);
  const isWoman = pay?.gender === 'Woman';
  const url = pay?.screenshotUrl;
  const hasProof = Boolean(url && url.length > 5 && !imgError);

  if (isWoman) {
    return (
      <div 
        style={{
          padding: '5px 8px',
          borderRadius: '10px',
          background: '#FDF2F8',
          border: '1px solid #FBCFE8',
          color: '#DB2777',
          fontSize: '0.66rem',
          fontWeight: 800,
          whiteSpace: 'nowrap'
        }}
      >
        Free Pass
      </div>
    );
  }

  return (
    <div 
      onClick={hasProof ? onClick : undefined}
      title={hasProof ? "Click to view full payment screenshot" : "No screenshot uploaded"}
      style={{
        width: '44px',
        height: '48px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: hasProof ? '1.5px solid #09090B' : '1.5px dashed #DC2626',
        cursor: hasProof ? 'pointer' : 'default',
        position: 'relative',
        background: hasProof ? '#09090B' : '#FEF2F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {hasProof ? (
        <img 
          src={url} 
          alt="Receipt" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <Camera size={13} color="#DC2626" />
          <span style={{ fontSize: '0.48rem', fontWeight: 900, color: '#DC2626' }}>NO SS</span>
        </div>
      )}
      {hasProof && (
        <span style={{
          position: 'absolute', bottom: '1px', left: 0, right: 0,
          background: 'rgba(9,9,11,0.85)', color: '#FFFFFF',
          fontSize: '0.52rem', fontWeight: 900, textAlign: 'center', padding: '1px'
        }}>
          SS
        </span>
      )}
    </div>
  );
}

export default function AdminPanel({ isOpen, onClose, userProfile, onLoginSuccess, onLogout }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState(ENV.ADMIN_EMAIL || 'cupid.livepro@gmail.com');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Primary Spacious Screens:
  // 'verifications' (Pending only) | 'active' (Active Users) | 'rejected' (Rejected Profiles) | 'expired' (Expired) | 'users' (All Accounts) | 'financials' (Revenue & Cloud Sync)
  const [activeTab, setActiveTab] = useState('verifications');

  // Sub-sections in Verifications: 'men' | 'women'
  const [verifGenderTab, setVerifGenderTab] = useState('men');

  // Filter in Active Users screen: 'All' | 'Men' | 'Women'
  const [activeGenderFilter, setActiveGenderFilter] = useState('All');

  // Filter in User Accounts screen: 'All' | 'Men' | 'Women' | 'Others'
  const [genderFilter, setGenderFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Real Database State
  const [pendingPayments, setPendingPayments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [expiredList, setExpiredList] = useState([]);

  // Modals state
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [screenshotUserContext, setScreenshotUserContext] = useState(null);

  // Rejection Modal State
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [selectedReasonId, setSelectedReasonId] = useState('payment_invalid');
  const [customReasonText, setCustomReasonText] = useState('');

  // Toast / New Entry Notification
  const [newEntryAlert, setNewEntryAlert] = useState(null);
  const prevPendingCountRef = useRef(null);
  const prevUsersCountRef = useRef(null);

  // Profile modal photo carousel index
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Auto-authenticate if user session is already logged in as Admin
  useEffect(() => {
    if (isOpen && userProfile?.isAdmin) {
      setIsAuthenticated(true);
    }
  }, [isOpen, userProfile]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const parsedUsers = await fetchAllCloudUsers();
      if (Array.isArray(parsedUsers)) {
        setUsersList(parsedUsers);

        const now = new Date();
        const expired = parsedUsers.filter(u => u.status === 'expired' || (u.expiresAt && new Date(u.expiresAt) <= now));
        setExpiredList(expired);

        // Build verification queue from real users
        const pending = parsedUsers.map(u => {
          const isExp = expired.some(e => e.id === u.id);
          const isApproved = u.status === 'approved' && !isExp;
          const isRejected = u.status === 'rejected';

          return {
            id: `pay_${u.id}`,
            userId: u.id,
            userName: u.name,
            age: u.age || 24,
            city: u.city || 'Greater Noida',
            userEmail: u.email,
            userPhone: u.phone || '+91 9876543210',
            gender: u.gender || 'Man',
            planName: u.plan || (u.gender === 'Woman' ? 'Free Pass for Women' : '1 Month VIP Pass'),
            planDays: u.planDays || getPlanDurationDays(u.plan),
            planPrice: u.planPrice || (u.gender === 'Woman' ? 0 : 799),
            startsAt: u.startsAt,
            expiresAt: u.expiresAt,
            createdAt: u.createdAt,
            amount: u.gender === 'Woman' ? '₹0 FREE' : (u.payments?.[0]?.amount || `₹${u.planPrice || 799}`),
            type: 'Membership Pass',
            screenshotUrl: u.paymentProofUrl || u.paymentProof || null,
            timestamp: u.registered || 'Just now',
            status: isApproved ? 'approved' : (isRejected ? 'rejected' : 'pending'),
            rejectionReason: u.rejectionReason || '',
            photos: (u.photos && Array.isArray(u.photos) && u.photos.filter(Boolean).length > 0) ? u.photos.filter(Boolean) : [],
            bio: u.bio || '',
            prompt1: u.prompt1 || '',
            prompt1_answer: u.prompt1_answer || '',
            prompt2: u.prompt2 || '',
            prompt2_answer: u.prompt2_answer || ''
          };
        });

        // Check for incoming new registrations to alert admin
        const pendingCount = pending.filter(p => p.status === 'pending').length;
        if (prevPendingCountRef.current !== null && pendingCount > prevPendingCountRef.current) {
          const newest = pending.find(p => p.status === 'pending');
          if (newest) {
            playNewEntryChime();
            setNewEntryAlert({
              name: newest.userName,
              gender: newest.gender,
              plan: newest.planName,
              amount: newest.amount
            });
            setTimeout(() => setNewEntryAlert(null), 6000);
          }
        }
        prevPendingCountRef.current = pendingCount;
        prevUsersCountRef.current = parsedUsers.length;

        setPendingPayments(pending);
      }
    } catch (err) {
      console.error('Error loading db users in AdminPanel:', err);
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Sync real registered users from cloud & local database whenever panel opens or authenticates
  useEffect(() => {
    if (!isOpen) {
      if (!userProfile?.isAdmin) setIsAuthenticated(false);
      return;
    }

    loadUsers();
    const pollInterval = setInterval(loadUsers, 3000); // 3s Real-Time Polling Loop

    return () => clearInterval(pollInterval);
  }, [isOpen, isAuthenticated, userProfile, loadUsers]);

  const handleManualSupabaseSync = async () => {
    setIsSyncingSupabase(true);
    setSyncMsg('');
    try {
      const count = await backfillAllUsersToSupabase();
      setSyncMsg(`✅ Synced ${count} accounts with Supabase Auth & Profiles!`);
      setTimeout(() => setSyncMsg(''), 5000);
    } catch (err) {
      setSyncMsg('Sync note: ' + err.message);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    const isMatch = (cleanEmail === 'cupid.livepro@gmail.com' || cleanEmail === 'admin@cufy.app' || cleanEmail === 'admin') &&
                    (cleanPass === 'cUpid.livepro#@3210' || cleanPass === 'cupid.livepro#@3210' || cleanPass === 'admin' || cleanPass === ENV.ADMIN_PASS_HASH);

    if (isMatch) {
      setIsAuthenticated(true);
      setLoginError('');
      
      // Request native notification permission on admin login
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }

      try {
        await supabase.auth.signOut();
      } catch (aErr) {}

      if (onLoginSuccess) {
        onLoginSuccess({ email: 'cupid.livepro@gmail.com', name: 'Admin', isAdmin: true });
      }
    } else {
      setLoginError('Invalid credentials. Check email and password.');
    }
  };

  // FINANCIAL OVERVIEW CALCULATIONS
  const financialStats = useMemo(() => {
    let totalRevenue = 0;
    let thisMonthRevenue = 0;
    let pendingRevenue = 0;
    let pendingCount = 0;
    let activeApprovedCount = 0;
    let menCount = 0;
    let womenCount = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    usersList.forEach(u => {
      const isApproved = u.status === 'approved';
      const isPending = u.status === 'pending_approval' || u.status === 'pending';
      const price = u.gender === 'Woman' ? 0 : (u.planPrice || (u.plan?.includes('199') ? 199 : u.plan?.includes('299') ? 299 : u.plan?.includes('499') ? 499 : 799));

      if (isApproved) {
        activeApprovedCount++;
        totalRevenue += price;

        const regDate = u.startsAt ? new Date(u.startsAt) : (u.createdAt ? new Date(u.createdAt) : null);
        if (regDate && regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear) {
          thisMonthRevenue += price;
        } else if (!regDate) {
          thisMonthRevenue += price;
        }
      }

      if (isPending && u.gender !== 'Woman') {
        pendingCount++;
        pendingRevenue += price;
      }

      if (u.gender === 'Woman') womenCount++;
      else menCount++;
    });

    return {
      totalRevenue,
      thisMonthRevenue,
      pendingRevenue,
      pendingCount,
      activeApprovedCount,
      menCount,
      womenCount
    };
  }, [usersList]);

  // APPROVE PAYMENT / USER
  const handleApprovePayment = async (id, customDays = null) => {
    const targetPay = pendingPayments.find(p => p.id === id || p.userId === id);
    if (!targetPay) return;

    const targetUserId = targetPay.userId;
    const targetEmail = targetPay.userEmail;
    const planDays = customDays || targetPay.planDays || getPlanDurationDays(targetPay.planName);

    setPendingPayments(prev => prev.map(p => p.id === targetPay.id ? { ...p, status: 'approved' } : p));
    
    try {
      await updateCloudUserStatus(targetUserId, targetEmail, 'approved', {
        planName: targetPay.planName,
        planDays
      });
      
      const refreshed = await fetchAllCloudUsers();
      setUsersList(refreshed);
    } catch (e) {
      console.error('Approve payment error:', e);
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🎉 Account Approved!', {
          body: `${targetPay.userName}'s ${planDays}-day plan is active!`,
          icon: '/photos/cufylogo.jpg'
        });
      } catch (err) {}
    }

    if (selectedProfileUser?.id === targetUserId) {
      setSelectedProfileUser(prev => prev ? { ...prev, status: 'approved' } : null);
    }
    if (screenshotUserContext?.id === targetUserId) {
      setScreenshotUserContext(prev => prev ? { ...prev, status: 'approved' } : null);
    }
  };

  // OPEN REJECTION MODAL
  const handleOpenRejectionModal = (pay) => {
    setRejectionTarget(pay);
    setSelectedReasonId('payment_invalid');
    setCustomReasonText('');
  };

  // CONFIRM REJECTION WITH REASON
  const handleConfirmRejection = async () => {
    if (!rejectionTarget) return;

    const targetPay = rejectionTarget;
    let finalReason = '';
    if (selectedReasonId === 'custom') {
      finalReason = customReasonText.trim() || 'Verification details could not be verified.';
    } else {
      const found = REJECTION_REASONS.find(r => r.id === selectedReasonId);
      finalReason = found ? found.title : 'Verification rejected by administrator.';
    }

    setPendingPayments(prev => prev.map(p => p.id === targetPay.id ? { ...p, status: 'rejected', rejectionReason: finalReason } : p));
    setRejectionTarget(null);

    try {
      await updateCloudUserStatus(targetPay.userId, targetPay.userEmail, 'rejected', {
        rejectionReason: finalReason
      });
      const refreshed = await fetchAllCloudUsers();
      setUsersList(refreshed);
    } catch (e) {
      console.error('Reject payment error:', e);
    }

    if (selectedProfileUser?.id === targetPay.userId) {
      setSelectedProfileUser(prev => prev ? { ...prev, status: 'rejected', rejectionReason: finalReason } : null);
    }
    if (screenshotUserContext?.id === targetPay.userId) {
      setScreenshotUserContext(prev => prev ? { ...prev, status: 'rejected', rejectionReason: finalReason } : null);
    }
  };

  // SUSPEND USER
  const handleSuspendUser = async (userId, userEmail, userName) => {
    const confirmed = window.confirm(`Suspend / Lock out ${userName}'s account immediately?`);
    if (!confirmed) return;

    try {
      await updateCloudUserStatus(userId, userEmail, 'suspended', {
        rejectionReason: 'Account suspended by administrator.'
      });
      const refreshed = await fetchAllCloudUsers();
      setUsersList(refreshed);
      setPendingPayments(prev => prev.map(p => p.userId === userId ? { ...p, status: 'suspended' } : p));
      
      if (selectedProfileUser?.id === userId) {
        setSelectedProfileUser(null);
      }
    } catch (e) {
      console.error('Suspend error:', e);
    }
  };

  // Re-activate or Extend plan (+30d)
  const handleReactivateUser = async (user, days = 30) => {
    try {
      await updateCloudUserStatus(user.id, user.email, 'approved', {
        planName: user.plan || '1 Month VIP Pass',
        planDays: days
      });
      const refreshed = await fetchAllCloudUsers();
      setUsersList(refreshed);
      const now = new Date();
      setExpiredList(refreshed.filter(u => u.status === 'expired' || (u.expiresAt && new Date(u.expiresAt) <= now)));
      
      if (selectedProfileUser && selectedProfileUser.id === user.id) {
        const updatedUser = refreshed.find(u => u.id === user.id);
        if (updatedUser) setSelectedProfileUser(updatedUser);
      }
    } catch (e) {
      console.error('Reactivation error:', e);
    }
  };

  // 1. STRICT PENDING VERIFICATIONS QUEUE (Approved and Rejected are strictly excluded!)
  const pendingVerifications = useMemo(() => {
    return pendingPayments.filter(p => p.status === 'pending');
  }, [pendingPayments]);

  const menPendingVerifications = useMemo(() => {
    return pendingVerifications.filter(p => p.gender === 'Man');
  }, [pendingVerifications]);

  const womenPendingVerifications = useMemo(() => {
    return pendingVerifications.filter(p => p.gender === 'Woman');
  }, [pendingVerifications]);

  // 2. ACTIVE USERS (Approved and not expired)
  const activeUsers = useMemo(() => {
    const now = new Date();
    return pendingPayments.filter(p => {
      if (p.status !== 'approved') return false;
      if (p.expiresAt && new Date(p.expiresAt) <= now) return false;
      return true;
    });
  }, [pendingPayments]);

  const filteredActiveUsers = useMemo(() => {
    if (activeGenderFilter === 'Men') return activeUsers.filter(u => u.gender === 'Man');
    if (activeGenderFilter === 'Women') return activeUsers.filter(u => u.gender === 'Woman');
    return activeUsers;
  }, [activeUsers, activeGenderFilter]);

  // 3. REJECTED PROFILES (All accounts marked as rejected)
  const rejectedProfiles = useMemo(() => {
    return pendingPayments.filter(p => p.status === 'rejected');
  }, [pendingPayments]);

  // 4. FILTERED USERS FOR 'ALL ACCOUNTS'
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      if (genderFilter === 'Men' && u.gender !== 'Man') return false;
      if (genderFilter === 'Women' && u.gender !== 'Woman') return false;
      if (genderFilter === 'Others' && (u.gender === 'Man' || u.gender === 'Woman')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (u.name || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchPhone = (u.phone || '').toLowerCase().includes(q);
        const matchCity = (u.city || '').toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone || matchCity;
      }
      return true;
    });
  }, [usersList, genderFilter, searchQuery]);

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      width: '100%', height: '100%',
      background: '#F5F3EF',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }} className="animate-fade-in">

      {/* 1. LOGIN VIEW */}
      {!isAuthenticated ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', padding: '10px', background: '#FFFFFF', borderRadius: '50%', color: '#09090B', border: '1px solid #E4E4E7', cursor: 'pointer' }}>
            ✕
          </button>

          <div style={{ width: '100%', maxWidth: '360px', background: '#FFFFFF', borderRadius: '28px', padding: '32px 24px', border: '1.5px solid #E4E4E7', boxShadow: '0 16px 40px rgba(0,0,0,0.06)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'serif', fontStyle: 'italic', color: '#09090B' }}>
                cufy<span style={{ color: '#FF3B30', fontStyle: 'normal' }}>.</span>
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                Admin Portal
              </div>
            </div>

            {loginError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '14px', fontSize: '0.82rem', fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 800 }}>Admin Email</label>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
                  className="form-input" style={{ borderRadius: '16px', background: '#F5F3EF' }} required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 800 }}>Password</label>
                <input 
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} 
                  className="form-input" style={{ borderRadius: '16px', background: '#F5F3EF' }} required
                />
              </div>

              <button type="submit" className="btn-black-pill" style={{ width: '100%', marginTop: '8px' }}>
                Enter Admin Console
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* 2. MAIN SPACIOUS DASHBOARD VIEW */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
          
          {/* Top Floating Notification Banner on New User Entry */}
          {newEntryAlert && (
            <div style={{
              position: 'absolute',
              top: '68px',
              left: '16px',
              right: '16px',
              zIndex: 50,
              background: '#09090B',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.15)'
            }} className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={16} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 900 }}>New Entry Received!</div>
                  <div style={{ fontSize: '0.74rem', color: '#A1A1AA' }}>
                    {newEntryAlert.name} ({newEntryAlert.gender}) • {getSimplifiedPlanBadge(newEntryAlert.plan, newEntryAlert.amount, newEntryAlert.gender)}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setActiveTab('verifications');
                  setVerifGenderTab(newEntryAlert.gender === 'Woman' ? 'women' : 'men');
                  setNewEntryAlert(null);
                }}
                style={{
                  background: '#FFFFFF',
                  color: '#09090B',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                View
              </button>
            </div>
          )}

          {/* Clean Spacious Header */}
          <div style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
            borderBottom: '1px solid #E4E4E7',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.45rem', fontWeight: 900, fontFamily: 'serif', fontStyle: 'italic', color: '#09090B' }}>
                cufy<span style={{ color: '#FF3B30', fontStyle: 'normal' }}>.</span>
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 900, background: '#09090B', color: '#FFFFFF', padding: '3px 8px', borderRadius: '8px' }}>
                PRO
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={handleManualRefresh} style={{ padding: '7px 12px', background: '#F4F4F5', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, color: '#09090B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button onClick={() => setIsAuthenticated(false)} style={{ padding: '7px 12px', background: '#F4F4F5', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, color: '#09090B', border: 'none', cursor: 'pointer' }}>
                Log out
              </button>
              <button onClick={onClose} style={{ padding: '7px', background: '#F4F4F5', borderRadius: '50%', color: '#09090B', border: 'none', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div style={{ padding: '12px 18px 6px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {/* Total Collected Revenue */}
            <div style={{
              background: '#FFFFFF',
              padding: '12px 14px',
              borderRadius: '20px',
              border: '1.5px solid #E4E4E7',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Total Collected
                </span>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={12} color="#059669" />
                </span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#059669', marginTop: '2px', letterSpacing: '-0.5px' }}>
                ₹{financialStats.totalRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#71717A', fontWeight: 700, marginTop: '2px' }}>
                {activeUsers.length} active member{activeUsers.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* This Month's Revenue */}
            <div style={{
              background: '#FFFFFF',
              padding: '12px 14px',
              borderRadius: '20px',
              border: '1.5px solid #E4E4E7',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  This Month
                </span>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={12} color="#4F46E5" />
                </span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#4F46E5', marginTop: '2px', letterSpacing: '-0.5px' }}>
                ₹{financialStats.thisMonthRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#71717A', fontWeight: 700, marginTop: '2px' }}>
                Pipeline: ₹{financialStats.pendingRevenue.toLocaleString()} ({pendingVerifications.length} pending)
              </div>
            </div>
          </div>

          {/* MAIN CATEGORY TABS - SPACIOUS HORIZONTAL NAVIGATION */}
          <div style={{ padding: '8px 18px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            <button 
              onClick={() => setActiveTab('verifications')}
              style={{
                padding: '8px 14px', borderRadius: '12px',
                background: activeTab === 'verifications' ? '#09090B' : '#FFFFFF',
                color: activeTab === 'verifications' ? '#FFFFFF' : '#71717A',
                fontWeight: 800, fontSize: '0.78rem', border: '1px solid #E4E4E7', whiteSpace: 'nowrap', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>🛡️ Pending ({pendingVerifications.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('active')}
              style={{
                padding: '8px 14px', borderRadius: '12px',
                background: activeTab === 'active' ? '#09090B' : '#FFFFFF',
                color: activeTab === 'active' ? '#FFFFFF' : '#71717A',
                fontWeight: 800, fontSize: '0.78rem', border: '1px solid #E4E4E7', whiteSpace: 'nowrap', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>🟢 Active Users ({activeUsers.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('rejected')}
              style={{
                padding: '8px 14px', borderRadius: '12px',
                background: activeTab === 'rejected' ? '#09090B' : '#FFFFFF',
                color: activeTab === 'rejected' ? '#FFFFFF' : '#71717A',
                fontWeight: 800, fontSize: '0.78rem', border: '1px solid #E4E4E7', whiteSpace: 'nowrap', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>🚫 Rejected ({rejectedProfiles.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('expired')}
              style={{
                padding: '8px 14px', borderRadius: '12px',
                background: activeTab === 'expired' ? '#09090B' : '#FFFFFF',
                color: activeTab === 'expired' ? '#FFFFFF' : '#71717A',
                fontWeight: 800, fontSize: '0.78rem', border: '1px solid #E4E4E7', whiteSpace: 'nowrap', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>⏳ Expired ({expiredList.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('users')}
              style={{
                padding: '8px 14px', borderRadius: '12px',
                background: activeTab === 'users' ? '#09090B' : '#FFFFFF',
                color: activeTab === 'users' ? '#FFFFFF' : '#71717A',
                fontWeight: 800, fontSize: '0.78rem', border: '1px solid #E4E4E7', whiteSpace: 'nowrap', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>👥 All Accounts ({usersList.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('financials')}
              style={{
                padding: '8px 14px', borderRadius: '12px',
                background: activeTab === 'financials' ? '#09090B' : '#FFFFFF',
                color: activeTab === 'financials' ? '#FFFFFF' : '#71717A',
                fontWeight: 800, fontSize: '0.78rem', border: '1px solid #E4E4E7', whiteSpace: 'nowrap', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>📊 Financials</span>
            </button>
          </div>

          {/* MAIN DASHBOARD CONTENT VIEWPORT */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 100px' }}>
            
            {/* =========================================================================
                SCREEN 1: VERIFICATIONS QUEUE (STRICTLY PENDING ACCOUNTS ONLY!)
                ========================================================================= */}
            {activeTab === 'verifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* 2 Sub-Sections: Men (Paid) vs Women (Free) */}
                <div style={{ display: 'flex', gap: '6px', background: '#E4E4E7', padding: '3px', borderRadius: '14px' }}>
                  <button
                    onClick={() => setVerifGenderTab('men')}
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      borderRadius: '11px',
                      border: 'none',
                      background: verifGenderTab === 'men' ? '#FFFFFF' : 'transparent',
                      color: verifGenderTab === 'men' ? '#09090B' : '#71717A',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: verifGenderTab === 'men' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    <span>Men (Paid Queue)</span>
                    <span style={{
                      background: verifGenderTab === 'men' ? '#FF3B30' : '#A1A1AA',
                      color: '#FFFFFF',
                      fontSize: '0.65rem',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      fontWeight: 900
                    }}>
                      {menPendingVerifications.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setVerifGenderTab('women')}
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      borderRadius: '11px',
                      border: 'none',
                      background: verifGenderTab === 'women' ? '#FFFFFF' : 'transparent',
                      color: verifGenderTab === 'women' ? '#09090B' : '#71717A',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: verifGenderTab === 'women' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    <span>Women (Free Queue)</span>
                    <span style={{
                      background: verifGenderTab === 'women' ? '#059669' : '#A1A1AA',
                      color: '#FFFFFF',
                      fontSize: '0.65rem',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      fontWeight: 900
                    }}>
                      {womenPendingVerifications.length}
                    </span>
                  </button>
                </div>

                {/* --- A. MEN'S PENDING VERIFICATION QUEUE --- */}
                {verifGenderTab === 'men' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {menPendingVerifications.length === 0 ? (
                      <div style={{
                        background: '#FFFFFF',
                        borderRadius: '24px',
                        padding: '44px 20px',
                        textAlign: 'center',
                        border: '1.5px dashed #D4D4D8'
                      }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ECFDF5', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle2 size={24} color="#059669" />
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#09090B' }}>
                          All Caught Up!
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#71717A', marginTop: '4px', maxWidth: '280px', margin: '4px auto 0' }}>
                          No pending male payments in queue. Approved users are in the <b>Active Users</b> tab.
                        </div>
                      </div>
                    ) : (
                      menPendingVerifications.map((pay) => (
                        <div 
                          key={pay.id} 
                          style={{
                            background: '#FFFFFF',
                            borderRadius: '22px',
                            padding: '14px 16px',
                            border: '2px solid #FF3B30',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          {/* Real User DP Avatar */}
                          <UserAvatar user={pay} size={48} onClick={() => setSelectedProfileUser(pay)} />

                          {/* Minimal Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span 
                                onClick={() => setSelectedProfileUser(pay)}
                                style={{ fontSize: '0.96rem', fontWeight: 900, color: '#09090B', cursor: 'pointer' }}
                              >
                                {pay.userName}, {pay.age}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                              {/* Simplified Plan Badge */}
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background: '#FEF2F2',
                                color: '#DC2626',
                                padding: '2px 8px',
                                borderRadius: '6px'
                              }}>
                                {getSimplifiedPlanBadge(pay.planName, pay.amount, pay.gender)}
                              </span>

                              <span style={{ fontSize: '0.68rem', color: '#A1A1AA', fontWeight: 600 }}>
                                {pay.timestamp}
                              </span>
                            </div>
                          </div>

                          {/* Right: Payment Screenshot Thumbnail + Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <ScreenshotThumbnail 
                              pay={pay} 
                              onClick={() => {
                                setSelectedScreenshot(pay.screenshotUrl);
                                setScreenshotUserContext(pay);
                              }} 
                            />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {/* Reject Button -> Opens Rejection Modal */}
                              <button
                                onClick={() => handleOpenRejectionModal(pay)}
                                title="Reject Verification"
                                style={{
                                  width: '38px', height: '38px',
                                  borderRadius: '50%',
                                  background: '#FEE2E2',
                                  color: '#DC2626',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 6px rgba(220,38,38,0.15)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <X size={18} strokeWidth={2.6} />
                              </button>

                              {/* Approve Button -> Approves immediately */}
                              <button
                                onClick={() => handleApprovePayment(pay.id)}
                                title={`Approve Payment & Start ${pay.planDays}d Plan`}
                                style={{
                                  width: '38px', height: '38px',
                                  borderRadius: '50%',
                                  background: '#10B981',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Check size={20} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* --- B. WOMEN'S PENDING VERIFICATION QUEUE --- */}
                {verifGenderTab === 'women' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {womenPendingVerifications.length === 0 ? (
                      <div style={{
                        background: '#FFFFFF',
                        borderRadius: '24px',
                        padding: '44px 20px',
                        textAlign: 'center',
                        border: '1.5px dashed #D4D4D8'
                      }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FDF2F8', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Heart size={24} color="#DB2777" />
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#09090B' }}>
                          No Pending Female Profiles
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#71717A', marginTop: '4px' }}>
                          Female profiles are automatically approved and listed under Active Users.
                        </div>
                      </div>
                    ) : (
                      womenPendingVerifications.map((girl) => (
                        <div 
                          key={girl.id} 
                          style={{
                            background: '#FFFFFF',
                            borderRadius: '22px',
                            padding: '14px 16px',
                            border: '1.5px solid #E4E4E7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <UserAvatar user={girl} size={48} onClick={() => setSelectedProfileUser(girl)} />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.96rem', fontWeight: 900, color: '#09090B' }}>
                              {girl.userName}, {girl.age}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background: '#FDF2F8',
                                color: '#DB2777',
                                padding: '2px 8px',
                                borderRadius: '6px'
                              }}>
                                Free (Women)
                              </span>
                              <span style={{ fontSize: '0.68rem', color: '#A1A1AA' }}>{girl.city}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenRejectionModal(girl)}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <X size={16} />
                            </button>
                            <button
                              onClick={() => handleApprovePayment(girl.id, 365)}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10B981', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <Check size={18} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>
            )}

            {/* =========================================================================
                SCREEN 2: ACTIVE USERS (DEDICATED COLUMN/SCREEN FOR ALL ACTIVE USERS!)
                ========================================================================= */}
            {activeTab === 'active' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Active Sub-Filter & Counter Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#09090B' }}>
                    Active Members ({activeUsers.length} total)
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['All', 'Men', 'Women'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setActiveGenderFilter(g)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '10px',
                          background: activeGenderFilter === g ? '#09090B' : '#FFFFFF',
                          color: activeGenderFilter === g ? '#FFFFFF' : '#71717A',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          border: '1px solid #E4E4E7',
                          cursor: 'pointer'
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredActiveUsers.length === 0 ? (
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '44px 20px',
                    textAlign: 'center',
                    border: '1.5px dashed #D4D4D8'
                  }}>
                    <Users size={32} color="#A1A1AA" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#09090B' }}>No Active Users Found</div>
                    <div style={{ fontSize: '0.78rem', color: '#71717A', marginTop: '4px' }}>
                      Approve pending accounts to give members active access.
                    </div>
                  </div>
                ) : (
                  filteredActiveUsers.map((user) => {
                    const rem = user.expiresAt ? formatRemainingTime(user.expiresAt) : null;
                    return (
                      <div 
                        key={user.id}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: '22px',
                          padding: '14px 16px',
                          border: '1.5px solid #E4E4E7',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        {/* Real DP Avatar */}
                        <UserAvatar user={user} size={48} onClick={() => setSelectedProfileUser(user)} />

                        {/* User Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span 
                              onClick={() => setSelectedProfileUser(user)}
                              style={{ fontSize: '0.96rem', fontWeight: 900, color: '#09090B', cursor: 'pointer' }}
                            >
                              {user.userName}, {user.age}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#71717A', background: '#F4F4F5', padding: '1px 6px', borderRadius: '6px' }}>
                              {user.gender}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                            {/* Simplified Plan Badge */}
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: '#F4F4F5',
                              color: '#09090B',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              {getSimplifiedPlanBadge(user.planName, user.amount, user.gender)}
                            </span>

                            {rem && !rem.expired ? (
                              <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 800 }}>
                                ⏳ Active: {rem.text}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 800 }}>
                                ⏳ Active
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.7rem', color: '#71717A', fontWeight: 600, marginTop: '2px' }}>
                            {user.city} • {user.userEmail}
                          </div>
                        </div>

                        {/* Quick Actions for Active User */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button
                            onClick={() => setSelectedProfileUser(user)}
                            title="Inspect Profile"
                            style={{
                              padding: '7px 11px',
                              background: '#F4F4F5',
                              color: '#09090B',
                              borderRadius: '10px',
                              border: 'none',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            Inspect
                          </button>

                          <button
                            onClick={() => handleSuspendUser(user.userId, user.userEmail, user.userName)}
                            title="Suspend user"
                            style={{
                              width: '32px', height: '32px',
                              borderRadius: '10px',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

              </div>
            )}

            {/* =========================================================================
                SCREEN 3: REJECTED PROFILES (DEDICATED ARCHIVE FOR REJECTED ACCOUNTS!)
                ========================================================================= */}
            {activeTab === 'rejected' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#09090B' }}>
                    Rejected Profiles Archive ({rejectedProfiles.length})
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 700 }}>
                    Click "Re-approve" to restore any account
                  </span>
                </div>

                {rejectedProfiles.length === 0 ? (
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '44px 20px',
                    textAlign: 'center',
                    border: '1.5px dashed #D4D4D8'
                  }}>
                    <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#09090B' }}>No Rejected Profiles</div>
                    <div style={{ fontSize: '0.78rem', color: '#71717A', marginTop: '4px' }}>
                      All registered members have passed verification.
                    </div>
                  </div>
                ) : (
                  rejectedProfiles.map((user) => (
                    <div 
                      key={user.id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '22px',
                        padding: '14px 16px',
                        border: '1.5px solid #FCA5A5',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      {/* Real DP Avatar */}
                      <UserAvatar user={user} size={48} onClick={() => setSelectedProfileUser(user)} />

                      {/* User Info & Rejection Reason */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span 
                            onClick={() => setSelectedProfileUser(user)}
                            style={{ fontSize: '0.96rem', fontWeight: 900, color: '#09090B', cursor: 'pointer' }}
                          >
                            {user.userName}, {user.age}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#71717A', background: '#F4F4F5', padding: '1px 6px', borderRadius: '6px' }}>
                            {user.gender}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                          {/* Simplified Plan Badge */}
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: '#F4F4F5',
                            color: '#09090B',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}>
                            {getSimplifiedPlanBadge(user.planName, user.amount, user.gender)}
                          </span>

                          <span style={{ fontSize: '0.68rem', color: '#A1A1AA' }}>{user.city}</span>
                        </div>

                        {/* Rejection Reason Badge */}
                        <div style={{
                          fontSize: '0.72rem',
                          color: '#DC2626',
                          fontWeight: 700,
                          marginTop: '4px',
                          background: '#FEF2F2',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          display: 'inline-block'
                        }}>
                          ✕ {user.rejectionReason || 'Verification rejected by administrator'}
                        </div>
                      </div>

                      {/* Right: SS Preview + Re-approve Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {user.screenshotUrl && (
                          <ScreenshotThumbnail 
                            pay={user} 
                            onClick={() => {
                              setSelectedScreenshot(user.screenshotUrl);
                              setScreenshotUserContext(user);
                            }} 
                          />
                        )}

                        <button
                          onClick={() => handleApprovePayment(user.id)}
                          style={{
                            padding: '8px 14px',
                            background: '#09090B',
                            color: '#FFFFFF',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: 900,
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Re-approve
                        </button>
                      </div>
                    </div>
                  ))
                )}

              </div>
            )}

            {/* =========================================================================
                SCREEN 4: EXPIRED MEMBERSHIPS
                ========================================================================= */}
            {activeTab === 'expired' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#09090B', marginBottom: '2px' }}>
                  Expired Member Plans ({expiredList.length})
                </div>

                {expiredList.length === 0 ? (
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '44px 20px',
                    textAlign: 'center',
                    border: '1.5px dashed #D4D4D8'
                  }}>
                    <Clock size={32} color="#A1A1AA" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#09090B' }}>No Expired Accounts</div>
                    <div style={{ fontSize: '0.78rem', color: '#71717A', marginTop: '4px' }}>
                      All current member subscriptions are active or pending.
                    </div>
                  </div>
                ) : (
                  expiredList.map((exp) => (
                    <div key={exp.id} style={{
                      background: '#FFFFFF', borderRadius: '22px', padding: '16px', border: '1.5px solid #FCA5A5',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'
                    }}>
                      <UserAvatar user={exp} size={48} onClick={() => setSelectedProfileUser(exp)} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.96rem', fontWeight: 900, color: '#09090B' }}>{exp.name}, {exp.age || 24}</div>
                        <div style={{ fontSize: '0.76rem', color: '#71717A', fontWeight: 600 }}>{exp.email} • {exp.phone}</div>
                        <div style={{ fontSize: '0.78rem', color: '#991B1B', fontWeight: 800, marginTop: '3px' }}>
                          Expired: {getSimplifiedPlanBadge(exp.plan, exp.planPrice, exp.gender)} ({exp.expiresAt ? new Date(exp.expiresAt).toLocaleDateString() : 'Earlier'})
                        </div>
                      </div>

                      <button
                        onClick={() => handleReactivateUser(exp, 30)}
                        style={{
                          padding: '8px 14px',
                          background: '#09090B',
                          color: '#FFFFFF',
                          borderRadius: '12px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          border: 'none',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        Reactivate (+30d)
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* =========================================================================
                SCREEN 5: ALL USER ACCOUNTS (SEARCHABLE DIRECTORY)
                ========================================================================= */}
            {activeTab === 'users' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Search Bar & Gender Sub-Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} color="#A1A1AA" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search accounts by name, email, phone, city..."
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        borderRadius: '14px',
                        background: '#FFFFFF',
                        border: '1.5px solid #E4E4E7',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['All', 'Men', 'Women', 'Others'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGenderFilter(g)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          background: genderFilter === g ? '#FF3B30' : '#FFFFFF',
                          color: genderFilter === g ? '#FFFFFF' : '#09090B',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          border: '1px solid #E4E4E7',
                          cursor: 'pointer'
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 20px', color: '#71717A', fontWeight: 600 }}>
                      No matching accounts found.
                    </div>
                  ) : (
                    filteredUsers.map((usr) => {
                      const rem = usr.expiresAt ? formatRemainingTime(usr.expiresAt) : null;
                      const isApproved = usr.status === 'approved' && (!rem || !rem.expired);
                      const isPending = usr.status === 'pending_approval' || usr.status === 'pending';
                      const isRejected = usr.status === 'rejected';
                      const isExp = usr.status === 'expired' || (rem && rem.expired);

                      return (
                        <div 
                          key={usr.id}
                          style={{
                            background: '#FFFFFF',
                            borderRadius: '22px',
                            padding: '14px 16px',
                            border: '1.5px solid #E4E4E7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div 
                            onClick={() => setSelectedProfileUser(usr)}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer', minWidth: 0 }}
                          >
                            <UserAvatar user={usr} size={46} />
                            
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.96rem', fontWeight: 900, color: '#09090B' }}>
                                  {usr.name}, {usr.age}
                                </span>
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#F4F4F5', padding: '1px 6px', borderRadius: '6px', color: '#71717A' }}>
                                  {usr.gender}
                                </span>
                                
                                {isApproved && (
                                  <span style={{ fontSize: '0.66rem', fontWeight: 800, background: '#ECFDF5', color: '#059669', padding: '2px 6px', borderRadius: '6px' }}>
                                    APPROVED
                                  </span>
                                )}
                                {isPending && (
                                  <span style={{ fontSize: '0.66rem', fontWeight: 800, background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '6px' }}>
                                    PENDING
                                  </span>
                                )}
                                {isRejected && (
                                  <span style={{ fontSize: '0.66rem', fontWeight: 800, background: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: '6px' }}>
                                    REJECTED
                                  </span>
                                )}
                                {isExp && (
                                  <span style={{ fontSize: '0.66rem', fontWeight: 800, background: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: '6px' }}>
                                    EXPIRED
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: '0.74rem', color: '#71717A', fontWeight: 600, marginTop: '2px' }}>
                                {usr.city} • {getSimplifiedPlanBadge(usr.plan, usr.planPrice, usr.gender)}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {isPending && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprovePayment(`pay_${usr.id}`, usr.planDays || 30);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: '#10B981',
                                  color: '#FFFFFF',
                                  borderRadius: '10px',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                Approve
                              </button>
                            )}
                            <ChevronRight size={18} style={{ color: '#71717A', cursor: 'pointer' }} onClick={() => setSelectedProfileUser(usr)} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* =========================================================================
                SCREEN 6: FINANCIALS & CLOUD REAL-TIME SYNC
                ========================================================================= */}
            {activeTab === 'financials' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#09090B' }}>
                  Revenue & Cloud System Health
                </div>

                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '20px',
                  border: '1.5px solid #E4E4E7',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Revenue Metrics
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '14px' }}>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: '#71717A', fontWeight: 700 }}>Total Collected</div>
                      <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
                        ₹{financialStats.totalRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: '#71717A', fontWeight: 700 }}>This Month</div>
                      <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#4F46E5', marginTop: '2px' }}>
                        ₹{financialStats.thisMonthRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: '#71717A', fontWeight: 700 }}>Pending in Pipeline</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#D97706', marginTop: '2px' }}>
                        ₹{financialStats.pendingRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: '#71717A', fontWeight: 700 }}>Paid Active Members</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#09090B', marginTop: '2px' }}>
                        {activeUsers.length} accounts
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supabase Sync Card */}
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '20px',
                  border: '1.5px solid #E4E4E7'
                }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#09090B' }}>
                    Supabase Cloud Database Sync
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#71717A', marginTop: '4px', lineHeight: 1.4 }}>
                    Backfill all local registrations and profiles directly into Supabase Auth & PostgreSQL tables.
                  </div>

                  <button
                    onClick={handleManualSupabaseSync}
                    disabled={isSyncingSupabase}
                    style={{
                      marginTop: '14px',
                      background: '#09090B',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '11px 18px',
                      borderRadius: '14px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: isSyncingSupabase ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <UploadCloud size={16} />
                    {isSyncingSupabase ? 'Syncing with Supabase...' : 'Sync All Accounts to Supabase'}
                  </button>

                  {syncMsg && (
                    <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 800, marginTop: '10px' }}>
                      {syncMsg}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

          {/* =========================================================================
              MODAL 1: REJECTION REASON MODAL (POPS UP ON CROSS ✕ CLICK)
              ========================================================================= */}
          {rejectionTarget && (
            <div 
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(9, 9, 11, 0.78)',
                backdropFilter: 'blur(12px)',
                zIndex: 1300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
              }}
              onClick={() => setRejectionTarget(null)}
            >
              <div 
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  background: '#FFFFFF',
                  borderRadius: '28px',
                  padding: '24px 22px',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}
                className="animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={16} color="#DC2626" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#09090B', margin: 0 }}>
                        Reject Verification
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: '#71717A', fontWeight: 600 }}>
                        {rejectionTarget.userName} • {getSimplifiedPlanBadge(rejectionTarget.planName, rejectionTarget.amount, rejectionTarget.gender)}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setRejectionTarget(null)}
                    style={{ padding: '6px', background: '#F4F4F5', borderRadius: '50%', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#52525B', margin: '0 0 16px', lineHeight: 1.4 }}>
                  Select the exact reason for rejecting this verification. This profile will be moved to <b>Rejected Profiles</b> and the member will be notified.
                </p>

                {/* Predefined Reasons Radio List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {REJECTION_REASONS.map((r) => {
                    const isSelected = selectedReasonId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedReasonId(r.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '16px',
                          border: isSelected ? '2px solid #DC2626' : '1.5px solid #E4E4E7',
                          background: isSelected ? '#FEF2F2' : '#FAFAFA',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: isSelected ? '#991B1B' : '#09090B' }}>
                            {r.title}
                          </span>
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '50%',
                            border: isSelected ? '5px solid #DC2626' : '2px solid #D4D4D8',
                            background: '#FFFFFF'
                          }}></div>
                        </div>
                        <div style={{ fontSize: '0.73rem', color: isSelected ? '#7F1D1D' : '#71717A', marginTop: '3px', lineHeight: 1.3 }}>
                          {r.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom reason text input */}
                {selectedReasonId === 'custom' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#09090B', marginBottom: '6px' }}>
                      Custom Reason for User:
                    </label>
                    <textarea
                      rows={3}
                      value={customReasonText}
                      onChange={(e) => setCustomReasonText(e.target.value)}
                      placeholder="e.g. UPI transaction ID could not be found. Please re-transfer and send full receipt."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '14px',
                        border: '1.5px solid #E4E4E7',
                        background: '#F4F4F5',
                        fontSize: '0.82rem',
                        fontFamily: 'inherit',
                        resize: 'none'
                      }}
                    />
                  </div>
                )}

                {/* Confirm Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setRejectionTarget(null)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '14px',
                      background: '#F4F4F5',
                      color: '#09090B',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleConfirmRejection}
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '14px',
                      background: '#DC2626',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 900,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(220,38,38,0.3)'
                    }}
                  >
                    <X size={16} strokeWidth={2.8} />
                    Confirm Rejection & Archive
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL 2: FULL PROFILE INSPECTION MODAL (OPENS ON AVATAR CLICK)
              ========================================================================= */}
          {selectedProfileUser && (
            <div 
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(9, 9, 11, 0.78)',
                backdropFilter: 'blur(14px)',
                zIndex: 1200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
              }}
              onClick={() => setSelectedProfileUser(null)}
            >
              <div 
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  background: '#FFFFFF',
                  borderRadius: '28px',
                  padding: '22px',
                  maxHeight: '92vh',
                  overflowY: 'auto'
                }}
                className="animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with Close */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#09090B' }}>
                      Profile Inspection
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: selectedProfileUser.status === 'approved' ? '#ECFDF5' : (selectedProfileUser.status === 'rejected' ? '#FEE2E2' : '#FEF3C7'),
                      color: selectedProfileUser.status === 'approved' ? '#059669' : (selectedProfileUser.status === 'rejected' ? '#DC2626' : '#D97706'),
                      padding: '2px 8px',
                      borderRadius: '8px',
                      textTransform: 'uppercase'
                    }}>
                      {selectedProfileUser.status}
                    </span>
                  </div>

                  <button onClick={() => setSelectedProfileUser(null)} style={{ padding: '6px', background: '#F4F4F5', borderRadius: '50%', border: 'none', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                {/* Photo Gallery with Thumbnails (User's real uploaded photos!) */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ width: '100%', height: '240px', borderRadius: '20px', overflow: 'hidden', background: '#18181B', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedProfileUser.photos && selectedProfileUser.photos[activePhotoIdx] ? (
                      <img 
                        src={selectedProfileUser.photos[activePhotoIdx]} 
                        alt={selectedProfileUser.userName || selectedProfileUser.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ color: '#FFFFFF', fontWeight: 900, fontSize: '2rem' }}>
                        {(selectedProfileUser.userName || selectedProfileUser.name || 'U').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(9,9,11,0.7)', color: '#FFFFFF', padding: '3px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}>
                      Photo {(activePhotoIdx || 0) + 1} of {selectedProfileUser.photos?.length || 1}
                    </div>
                  </div>

                  {/* Thumbnail Row */}
                  {selectedProfileUser.photos && selectedProfileUser.photos.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {selectedProfileUser.photos.map((ph, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActivePhotoIdx(idx)}
                          style={{
                            width: '48px', height: '48px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: activePhotoIdx === idx ? '2px solid #FF3B30' : '1px solid #E4E4E7',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          <img src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Identity & Basic Info */}
                <div style={{ background: '#F5F3EF', borderRadius: '18px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
                    {selectedProfileUser.userName || selectedProfileUser.name}, {selectedProfileUser.age || 24}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#71717A', fontWeight: 700, marginTop: '2px' }}>
                    {selectedProfileUser.gender} • {selectedProfileUser.city || 'Greater Noida'}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FF3B30', marginTop: '4px' }}>
                    Plan: {getSimplifiedPlanBadge(selectedProfileUser.planName || selectedProfileUser.plan, selectedProfileUser.amount, selectedProfileUser.gender)}
                  </div>
                </div>

                {/* Contact Info */}
                <div style={{ background: '#FFFFFF', border: '1.5px solid #E4E4E7', borderRadius: '18px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#09090B', marginBottom: '8px' }}>
                    Contact Details
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#52525B', marginBottom: '6px' }}>
                    <Mail size={14} color="#FF3B30" />
                    <span>{selectedProfileUser.userEmail || selectedProfileUser.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#52525B' }}>
                    <Phone size={14} color="#FF3B30" />
                    <span>{selectedProfileUser.userPhone || selectedProfileUser.phone || '+91 9876543210'}</span>
                  </div>
                </div>

                {/* Bio & Questionnaire Answers */}
                {(selectedProfileUser.bio || selectedProfileUser.prompt1_answer) && (
                  <div style={{ background: '#FFFFFF', border: '1.5px solid #E4E4E7', borderRadius: '18px', padding: '14px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#09090B', marginBottom: '6px' }}>
                      Bio & Answers
                    </div>
                    {selectedProfileUser.bio && (
                      <p style={{ fontSize: '0.8rem', color: '#52525B', margin: '0 0 8px', fontStyle: 'italic' }}>
                        "{selectedProfileUser.bio}"
                      </p>
                    )}
                    {selectedProfileUser.prompt1_answer && (
                      <div style={{ fontSize: '0.78rem', color: '#09090B', marginTop: '4px' }}>
                        <b>Q: {selectedProfileUser.prompt1 || 'About me'}:</b> {selectedProfileUser.prompt1_answer}
                      </div>
                    )}
                  </div>
                )}

                {/* View Payment Proof button if available */}
                {selectedProfileUser.screenshotUrl && (
                  <button
                    onClick={() => {
                      setSelectedScreenshot(selectedProfileUser.screenshotUrl);
                      setScreenshotUserContext(selectedProfileUser);
                    }}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '14px',
                      background: '#F4F4F5',
                      color: '#09090B',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      border: '1px solid #E4E4E7',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginBottom: '14px'
                    }}
                  >
                    <Camera size={14} />
                    View Attached Payment Proof Screenshot
                  </button>
                )}

                {/* Action Buttons in Inspection Sheet */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      const payItem = pendingPayments.find(p => p.userId === selectedProfileUser.userId || p.userId === selectedProfileUser.id);
                      if (payItem) handleOpenRejectionModal(payItem);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '14px',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <X size={16} /> Reject
                  </button>

                  <button
                    onClick={() => {
                      const targetId = selectedProfileUser.id.startsWith('pay_') ? selectedProfileUser.id : `pay_${selectedProfileUser.id}`;
                      handleApprovePayment(targetId, selectedProfileUser.planDays || 30);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '14px',
                      background: '#10B981',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={16} /> Approve
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL 3: SCREENSHOT ZOOM MODAL (OPENS ON THUMBNAIL CLICK)
              ========================================================================= */}
          {selectedScreenshot && (
            <div 
              onClick={() => {
                setSelectedScreenshot(null);
                setScreenshotUserContext(null);
              }}
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(9,9,11,0.85)',
                backdropFilter: 'blur(10px)',
                zIndex: 1400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: '430px', width: '100%', background: '#FFFFFF',
                  borderRadius: '26px', overflow: 'hidden', padding: '20px', textAlign: 'center',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', display: 'flex', flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#09090B', margin: 0 }}>
                      Payment Proof Screenshot
                    </h4>
                    {screenshotUserContext && (
                      <div style={{ fontSize: '0.74rem', color: '#71717A', fontWeight: 600 }}>
                        {screenshotUserContext.userName} • {getSimplifiedPlanBadge(screenshotUserContext.planName, screenshotUserContext.amount, screenshotUserContext.gender)}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedScreenshot(null);
                      setScreenshotUserContext(null);
                    }}
                    style={{ padding: '6px', background: '#F4F4F5', borderRadius: '50%', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Screenshot Display Frame */}
                <div style={{ flex: 1, overflow: 'hidden', borderRadius: '18px', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', padding: '8px' }}>
                  <img 
                    src={selectedScreenshot} 
                    alt="Payment Receipt" 
                    style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '12px' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#FFFFFF', padding: '20px' }}>
                    <AlertTriangle size={36} color="#F59E0B" />
                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Screenshot Expired or Broken</div>
                    <div style={{ fontSize: '0.72rem', color: '#A1A1AA' }}>Verify transaction offline or ask user to re-upload.</div>
                  </div>
                </div>

                {/* Quick Action Buttons inside Screenshot Modal */}
                {screenshotUserContext && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button
                      onClick={() => {
                        const target = screenshotUserContext;
                        setSelectedScreenshot(null);
                        setScreenshotUserContext(null);
                        handleOpenRejectionModal(target);
                      }}
                      style={{
                        flex: 1,
                        padding: '11px',
                        borderRadius: '12px',
                        background: '#FEE2E2',
                        color: '#DC2626',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <X size={16} /> Reject Proof
                    </button>

                    <button
                      onClick={() => {
                        handleApprovePayment(screenshotUserContext.id, screenshotUserContext.planDays || 30);
                        setSelectedScreenshot(null);
                        setScreenshotUserContext(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '11px',
                        borderRadius: '12px',
                        background: '#10B981',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Check size={16} /> Approve Payment
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
