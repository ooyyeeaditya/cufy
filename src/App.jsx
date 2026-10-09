import React, { useState, useEffect } from 'react';
import DeviceFrameToggle from './components/common/DeviceFrameToggle';
import CookieBanner from './components/common/CookieBanner';
import PrivacyPolicyModal from './components/common/PrivacyPolicyModal';
import TermsModal from './components/common/TermsModal';
import NotFound from './components/common/NotFound';
import InstallPwaBanner from './components/common/InstallPwaBanner';

import WelcomeHero from './components/onboarding/WelcomeHero';
import OnboardingWizard from './components/onboarding/OnboardingWizard';

import SwipeableHomeFeed from './components/app/SwipeableHomeFeed';
import LikesFeed from './components/app/LikesFeed';
import ProfileView from './components/app/ProfileView';
import ChatDrawer from './components/app/ChatDrawer';
import SettingsView from './components/app/SettingsView';
import BottomNav from './components/app/BottomNav';
import MatchModal from './components/app/MatchModal';
import FilterModal from './components/app/FilterModal';
import NotificationDrawer from './components/app/NotificationDrawer';
import AdminPanel from './components/app/AdminPanel';
import MembershipExpiredModal from './components/app/MembershipExpiredModal';
import VerificationRejectedModal from './components/app/VerificationRejectedModal';
import WelcomeOverlay from './components/app/WelcomeOverlay';

import { INITIAL_DAILY_MATCH } from './data/mockProfiles';
import { analytics } from './utils/analytics';
import { syncUserToCloud, formatPlanName, getPlanDurationDays } from './lib/cloudSync';
import { supabase } from './lib/supabase';
import { Clock, ShieldCheck, Sparkles, RefreshCw, X, LogOut, ShieldAlert } from 'lucide-react';
import { sendNativeNotification } from './utils/notifications';

import './styles/index.css';

export default function App() {
  // Navigation & Screen View State
  const [viewState, setViewState] = useState('welcome'); // 'welcome' | 'onboarding' | 'app' | '404'
  const [appTab, setAppTab] = useState('home'); // 'home' | 'likes' | 'chat' | 'settings' | 'profile_detail'
  
  // Selected Profile for detail view & chat
  const [selectedProfile, setSelectedProfile] = useState(INITIAL_DAILY_MATCH);
  const [activeChatMatch, setActiveChatMatch] = useState(null); // Default null so Chat tab ALWAYS opens Chat Logs!
  const [matchedProfile, setMatchedProfile] = useState(null);

  // User Session & Onboarding Data
  const [userProfile, setUserProfile] = useState(null);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Modals state
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Save user profile to persistent registered database & Cloud DB
  const saveUserToDatabase = (user) => {
    if (!user || user.isAdmin) return;
    try {
      const dbStr = localStorage.getItem('cufy_registered_users');
      let dbUsers = dbStr ? JSON.parse(dbStr) : [];
      const userEmail = (user.email || 'member@cufy.app').toLowerCase();
      const existingIdx = dbUsers.findIndex(u => u.email && u.email.toLowerCase() === userEmail);

      const record = {
        id: user.id || `usr_${Date.now()}`,
        name: user.name || 'Member',
        age: user.age || 24,
        gender: user.gender || 'Man',
        city: user.city || 'Greater Noida',
        email: userEmail,
        phone: user.phone || '+91 9876543210',
        status: user.status || 'pending_approval',
        plan: user.plan || (user.gender === 'Woman' ? 'Free Pass for Women' : '1 Month VIP Pass'),
        registered: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        photos: (user.photos && Array.isArray(user.photos) && user.photos.filter(Boolean).length > 0) ? user.photos.filter(Boolean) : (user.photo ? [user.photo] : []),
        boostCredits: user.boostCredits !== undefined ? user.boostCredits : (user.plan?.includes('799') || user.plan?.includes('month') || user.plan?.includes('VIP') ? 1 : 0),
        boostActiveUntil: user.boostActiveUntil || null,
        paymentProofUrl: user.paymentProofUrl || user.paymentProof || null,
        voiceNoteUrl: user.voiceNoteUrl || user.voice_note_url || null,
        voice_note_url: user.voiceNoteUrl || user.voice_note_url || null,
        matches: user.matches || [],
        payments: user.payments || [{ plan: user.plan || '1 Month Pass', amount: '₹799', date: 'Today', status: user.status === 'approved' ? 'Approved' : 'Pending', screenshot: user.paymentProofUrl || null }]
      };

      if (existingIdx >= 0) {
        dbUsers[existingIdx] = { ...dbUsers[existingIdx], ...record };
      } else {
        dbUsers.unshift(record);
      }
      localStorage.setItem('cufy_registered_users', JSON.stringify(dbUsers));

      // Sync user registration to cloud database for multi-device admin access
      syncUserToCloud(record);
    } catch (err) {
      console.error('Database save error:', err);
    }
  };


  // Sync user profile state from localStorage & Supabase
  const refreshUserSession = async () => {
    try {
      const savedUser = localStorage.getItem('cufy_active_user');
      if (savedUser) {
        let parsed = JSON.parse(savedUser);
        if (parsed && parsed.isAdmin) {
          setUserProfile(parsed);
          setViewState('admin');
          setIsAdminOpen(true);
          return;
        }

        const now = new Date();
        // Check local expiry
        if (parsed && parsed.expiresAt && new Date(parsed.expiresAt) <= now && parsed.gender !== 'Woman') {
          parsed.status = 'expired';
          localStorage.setItem('cufy_active_user', JSON.stringify(parsed));
        }

        // Live check against Supabase
        if (parsed && parsed.email && supabase) {
          try {
            const cleanEmail = parsed.email.toLowerCase().trim();
            const { data: dbProf } = await supabase
              .from('profiles')
              .select('id, is_verified, account_status, prompt2_answer, photos, voice_note_url')
              .eq('email', cleanEmail)
              .maybeSingle();

            // 1. If profile is marked Deleted by admin
            if (dbProf && (dbProf.account_status === 'Deleted' || (dbProf.prompt2_answer && dbProf.prompt2_answer.startsWith('[DELETED]')) || dbProf.name === '[Deleted Account]')) {
              localStorage.removeItem('cufy_active_user');
              setUserProfile(null);
              setViewState('welcome');
              setIsAdminOpen(false);
              return;
            }

            const { data: mem } = await supabase
              .from('memberships')
              .select('*')
              .eq('user_id', dbProf.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (mem?.status === 'deleted') {
              localStorage.removeItem('cufy_active_user');
              setUserProfile(null);
              setViewState('welcome');
              setIsAdminOpen(false);
              return;
            }

            // 2. Check rejection
            const isDbRejected = mem?.status === 'rejected' || (dbProf?.prompt2_answer && dbProf.prompt2_answer.startsWith('[REJECTION]:'));
            let rejectionReason = parsed.rejectionReason || '';
            if (dbProf?.prompt2_answer && dbProf.prompt2_answer.startsWith('[REJECTION]:')) {
              rejectionReason = dbProf.prompt2_answer.replace('[REJECTION]:', '').trim();
            }

            // 3. Expiry check
            let isExpired = false;
            if (mem?.expires_at && new Date(mem.expires_at) <= now && parsed.gender !== 'Woman') {
              isExpired = true;
            }

            const isVerified = Boolean(dbProf.is_verified || (mem && mem.status === 'approved'));

            const isDbPending = mem?.status === 'pending' || (parsed && (parsed.status === 'pending_approval' || parsed.status === 'pending'));

            let updatedStatus = parsed.status;
            if (dbProf.account_status === 'Suspended') updatedStatus = 'suspended';
            else if (isDbRejected) updatedStatus = 'rejected';
            else if (isExpired) updatedStatus = 'expired';
            else if (isDbPending) {
              updatedStatus = 'pending_approval';
            }
            else if (isVerified || (parsed.gender === 'Woman' && parsed.status !== 'pending_approval')) updatedStatus = 'approved';
            else updatedStatus = 'pending_approval';

            const realDbPhotos = (dbProf.photos && Array.isArray(dbProf.photos) && dbProf.photos.length > 0)
              ? dbProf.photos.filter(u => typeof u === 'string' && !u.includes('unsplash.com'))
              : (parsed.photos ? parsed.photos.filter(u => typeof u === 'string' && !u.includes('unsplash.com')) : []);

            parsed = {
              ...parsed,
              status: updatedStatus,
              is_verified: isVerified,
              rejectionReason,
              photos: realDbPhotos,
              voiceNoteUrl: dbProf.voice_note_url || parsed.voiceNoteUrl || null,
              voice_note_url: dbProf.voice_note_url || parsed.voice_note_url || null,
              startsAt: mem?.starts_at || parsed.startsAt || null,
              expiresAt: mem?.expires_at || parsed.expiresAt || null,
              plan: mem?.plan_type ? formatPlanName(mem.plan_type) : parsed.plan
            };
            localStorage.setItem('cufy_active_user', JSON.stringify(parsed));
          } catch (sbErr) {
            console.warn('Session refresh Supabase check:', sbErr);
          }
        }

        if (parsed) {
          setUserProfile(parsed);
          setViewState('app');
          setIsAdminOpen(false);
        } else {
          setUserProfile(null);
          setViewState('welcome');
          setIsAdminOpen(false);
        }
      } else {
        setUserProfile(null);
        setViewState('welcome');
        setIsAdminOpen(false);
      }
    } catch (err) {
      console.error('Session restore error:', err);
      setUserProfile(null);
      setViewState('welcome');
      setIsAdminOpen(false);
    }
  };

  // Restore persistent login session from localStorage on app launch & listen for Supabase OAuth
  useEffect(() => {
    refreshUserSession();

    // Check active Supabase OAuth session (Google OAuth redirect return)
    if (supabase && supabase.auth) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user && !localStorage.getItem('cufy_active_user')) {
          handleGoogleAuthUser(session.user);
        }
      }).catch(e => console.warn('Supabase getSession error:', e));

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user && !localStorage.getItem('cufy_active_user')) {
          handleGoogleAuthUser(session.user);
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  // Request notification permission gracefully so Android status bar receives alerts
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        Notification.requestPermission().catch(() => {});
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for real-time approval, rejection, and deletion events across tabs/window
  useEffect(() => {
    const handleApprovedEvent = (e) => {
      const detail = e?.detail;
      const currentEmail = userProfile?.email?.toLowerCase().trim();
      if (!detail || !detail.email || (currentEmail && detail.email.toLowerCase() === currentEmail)) {
        refreshUserSession();
        if (detail?.status === 'approved') {
          setShowWelcomeModal(true);
        }
      }
    };

    const handleRejectedEvent = (e) => {
      const detail = e?.detail;
      const currentEmail = userProfile?.email?.toLowerCase().trim();
      if (!detail || !detail.email || (currentEmail && detail.email.toLowerCase() === currentEmail)) {
        const reason = detail?.reason || 'Access revoked by administrator.';
        const rejectedUser = {
          ...userProfile,
          status: 'rejected',
          is_verified: false,
          rejectionReason: reason
        };
        setUserProfile(rejectedUser);
        localStorage.setItem('cufy_active_user', JSON.stringify(rejectedUser));

        sendNativeNotification(
          '⚠️ Profile Verification Update',
          `Reason: ${reason}. Tap to fix and re-upload.`,
          { tag: 'cufy-rejected' }
        );
      }
    };

    const handleDeletedEvent = (e) => {
      const detail = e?.detail;
      const currentEmail = userProfile?.email?.toLowerCase().trim();
      if (!detail || !detail.email || (currentEmail && detail.email.toLowerCase() === currentEmail)) {
        localStorage.removeItem('cufy_active_user');
        setUserProfile(null);
        setViewState('welcome');
        alert('Your account has been deleted by administrator.');
      }
    };

    window.addEventListener('cufy_user_approved', handleApprovedEvent);
    window.addEventListener('cufy_user_rejected', handleRejectedEvent);
    window.addEventListener('cufy_user_deleted', handleDeletedEvent);
    return () => {
      window.removeEventListener('cufy_user_approved', handleApprovedEvent);
      window.removeEventListener('cufy_user_rejected', handleRejectedEvent);
      window.removeEventListener('cufy_user_deleted', handleDeletedEvent);
    };
  }, [userProfile]);

  // Real-time status polling for ALL logged-in non-admin users (kicks out deleted, suspended, or rejected members in ~3s!)
  useEffect(() => {
    const shouldPoll = userProfile && userProfile.email && !userProfile.isAdmin;
    if (!shouldPoll || !supabase) return;

    const checkDbStatus = async () => {
      try {
        const cleanEmail = userProfile.email.toLowerCase().trim();
        const { data: dbProf } = await supabase
          .from('profiles')
          .select('id, is_verified, account_status, prompt2_answer, name')
          .eq('email', cleanEmail)
          .maybeSingle();

        // 1. Account was permanently deleted by admin
        if (dbProf && (dbProf.account_status === 'Deleted' || (dbProf.prompt2_answer && dbProf.prompt2_answer.startsWith('[DELETED]')) || dbProf.name === '[Deleted Account]')) {
          localStorage.removeItem('cufy_active_user');
          setUserProfile(null);
          setViewState('welcome');
          sendNativeNotification(
            '🚫 Account Removed',
            'Your Cufy profile has been permanently removed by administrator.',
            { tag: 'cufy-removed' }
          );
          alert('Your account has been deleted by administrator.');
          return;
        }

        // 2. Account was deactivated / suspended by admin
        if (dbProf.account_status === 'Suspended') {
          if (userProfile.status !== 'suspended') {
            const suspendedUser = { ...userProfile, status: 'suspended', is_verified: false };
            setUserProfile(suspendedUser);
            localStorage.setItem('cufy_active_user', JSON.stringify(suspendedUser));
            sendNativeNotification(
              '🚫 Account Deactivated',
              'Your profile has been deactivated by administrator.',
              { tag: 'cufy-suspended' }
            );
            alert('🚫 Account Notice: Your profile has been deactivated by administrator.');
          }
          return;
        }

        const { data: mem } = await supabase
          .from('memberships')
          .select('*')
          .eq('user_id', dbProf.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (mem?.status === 'deleted') {
          localStorage.removeItem('cufy_active_user');
          setUserProfile(null);
          setViewState('welcome');
          alert('Your account has been deleted by administrator.');
          return;
        }

        // 3. Account was rejected / revoked by admin with reason
        const isDbRejected = mem?.status === 'rejected' || (dbProf?.prompt2_answer && dbProf.prompt2_answer.startsWith('[REJECTION]:'));
        if (isDbRejected) {
          let reason = 'Payment receipt or profile information could not be verified.';
          if (dbProf?.prompt2_answer && dbProf.prompt2_answer.startsWith('[REJECTION]:')) {
            reason = dbProf.prompt2_answer.replace('[REJECTION]:', '').trim();
          }
          if (userProfile.status !== 'rejected' || userProfile.rejectionReason !== reason) {
            const rejectedUser = {
              ...userProfile,
              status: 'rejected',
              is_verified: false,
              rejectionReason: reason
            };
            setUserProfile(rejectedUser);
            localStorage.setItem('cufy_active_user', JSON.stringify(rejectedUser));

            sendNativeNotification(
              '⚠️ Profile Verification Update',
              `Reason: ${reason}. Tap to fix and re-upload.`,
              { tag: 'cufy-rejected' }
            );
          }
          return;
        }

        // 4. Expiry check
        const now = new Date();
        const isExpired = mem?.expires_at && new Date(mem.expires_at) <= now && userProfile.gender !== 'Woman';
        if (isExpired) {
          if (userProfile.status !== 'expired') {
            const expiredUser = { ...userProfile, status: 'expired' };
            setUserProfile(expiredUser);
            localStorage.setItem('cufy_active_user', JSON.stringify(expiredUser));
          }
          return;
        }

        // 5. Check if pending approval vs approved
        const isDbPending = mem?.status === 'pending' || (userProfile && (userProfile.status === 'pending_approval' || userProfile.status === 'pending'));

        if (isDbPending && !isDbRejected) {
          if (userProfile.status !== 'pending_approval') {
            const pendingUser = {
              ...userProfile,
              status: 'pending_approval',
              is_verified: false
            };
            setUserProfile(pendingUser);
            localStorage.setItem('cufy_active_user', JSON.stringify(pendingUser));
          }
        } else if (dbProf && (dbProf.is_verified || mem?.status === 'approved' || (userProfile.gender === 'Woman' && userProfile.status !== 'pending_approval'))) {
          if (userProfile.status !== 'approved') {
            const startsAt = mem?.starts_at || now.toISOString();
            const expiresAt = mem?.expires_at || new Date(now.getTime() + 30 * 86400000).toISOString();

            const approvedUser = {
              ...userProfile,
              status: 'approved',
              is_verified: true,
              startsAt,
              expiresAt,
              plan: mem?.plan_type ? formatPlanName(mem.plan_type) : userProfile.plan
            };

            setUserProfile(approvedUser);
            localStorage.setItem('cufy_active_user', JSON.stringify(approvedUser));

            try {
              const dbStr = localStorage.getItem('cufy_registered_users');
              if (dbStr) {
                let dbUsers = JSON.parse(dbStr);
                dbUsers = dbUsers.map(u => u.email?.toLowerCase() === cleanEmail ? { ...u, ...approvedUser } : u);
                localStorage.setItem('cufy_registered_users', JSON.stringify(dbUsers));
              }
            } catch (e) {}

            setShowWelcomeModal(true);
          }
        }
      } catch (err) {
        console.warn('Real-time polling note:', err);
      }
    };

    const pollInterval = setInterval(checkDbStatus, 3000);

    // Also realtime channel for instant event push
    let realtimeChannel = null;
    try {
      realtimeChannel = supabase
        .channel(`user_live_${cleanEmail}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `email=eq.${cleanEmail}` },
          () => { checkDbStatus(); }
        )
        .subscribe();
    } catch (e) {}

    return () => {
      clearInterval(pollInterval);
      if (realtimeChannel) {
        try { supabase.removeChannel(realtimeChannel); } catch (e) {}
      }
    };
  }, [userProfile]);

  // Automatic plan duration timer check: lock account when time is up!
  useEffect(() => {
    if (!userProfile || userProfile.isAdmin || userProfile.gender === 'Woman' || !userProfile.expiresAt) return;

    const checkExpiry = () => {
      const now = new Date();
      if (new Date(userProfile.expiresAt) <= now && userProfile.status === 'approved') {
        const expiredUser = { ...userProfile, status: 'expired' };
        setUserProfile(expiredUser);
        localStorage.setItem('cufy_active_user', JSON.stringify(expiredUser));
      }
    };

    checkExpiry();
    const expiryInterval = setInterval(checkExpiry, 30000);
    return () => clearInterval(expiryInterval);
  }, [userProfile]);


  useEffect(() => {
    analytics.trackPageView(viewState);
  }, [viewState]);

  // Handle Start Onboarding
  const handleStartOnboarding = (initialData) => {
    setUserProfile(initialData);
    setViewState('onboarding');
  };

  // Handle Onboarding Completion (Post Payment)
  const handleCompleteOnboarding = (completedData) => {
    setUserProfile(completedData);
    localStorage.setItem('cufy_active_user', JSON.stringify(completedData));
    saveUserToDatabase(completedData);

    if (completedData.isAdmin) {
      setViewState('admin');
      setIsAdminOpen(true);
    } else {
      setViewState('app');
      setAppTab('home');
      setIsAdminOpen(false);
      if (completedData.status === 'approved') {
        setShowWelcomeModal(true);
      }
    }
  };

  // Direct login for existing members
  const handleLoginSuccess = (user) => {
    setUserProfile(user);
    localStorage.setItem('cufy_active_user', JSON.stringify(user));
    saveUserToDatabase(user);

    if (user.isAdmin) {
      setViewState('admin');
      setIsAdminOpen(true);
    } else {
      setViewState('app');
      setAppTab('home');
      setIsAdminOpen(false);
      if (user.status === 'approved') {
        setShowWelcomeModal(true);
      }
    }
  };

  // Process authenticated Google user (from Google Identity Services or Supabase OAuth)
  const handleGoogleAuthUser = async (googleData) => {
    if (!googleData) return;
    const email = (googleData.email || '').toLowerCase().trim();
    if (!email) return;

    const name = googleData.name || googleData.user_metadata?.full_name || googleData.user_metadata?.name || email.split('@')[0];
    const photo = googleData.photo || googleData.picture || googleData.user_metadata?.avatar_url || googleData.user_metadata?.picture || null;

    // 1. Admin login verification
    if (email === 'cupid.livepro@gmail.com' || email === 'admin@cufy.app') {
      handleLoginSuccess({ email: 'cupid.livepro@gmail.com', name: 'Admin', isAdmin: true });
      return;
    }

    // 2. Check local database for existing registered user
    let matchedUser = null;
    try {
      const dbStr = localStorage.getItem('cufy_registered_users');
      const dbUsers = dbStr ? JSON.parse(dbStr) : [];
      matchedUser = dbUsers.find(u => u.email && u.email.toLowerCase() === email);
    } catch (e) {}

    // 3. Check Supabase profiles table if not matched in localStorage
    if (!matchedUser && supabase) {
      try {
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (dbProfile) {
          if (
            dbProfile.account_status === 'Deleted' || 
            (dbProfile.prompt2_answer && dbProfile.prompt2_answer.startsWith('[DELETED]')) ||
            dbProfile.name === '[Deleted Account]'
          ) {
            matchedUser = null;
          } else {
            const { data: mem } = await supabase
              .from('memberships')
              .select('*')
              .eq('user_id', dbProfile.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const isVerified = Boolean(dbProfile.is_verified || (mem && mem.status === 'approved'));
            const now = new Date();
            let isExpired = false;
            if (mem?.expires_at && new Date(mem.expires_at) <= now && dbProfile.gender !== 'Woman') {
              isExpired = true;
            }

            let finalStatus = 'pending_approval';
            if (dbProfile.account_status === 'Suspended') finalStatus = 'suspended';
            else if (isExpired) finalStatus = 'expired';
            else if (isVerified) finalStatus = 'approved';
            else finalStatus = 'pending_approval';

          matchedUser = {
            id: dbProfile.id,
            name: dbProfile.name || name,
            email: dbProfile.email,
            gender: dbProfile.gender || 'Man',
            age: dbProfile.age || 24,
            city: dbProfile.location || 'New Delhi',
            status: finalStatus,
            is_verified: isVerified,
            startsAt: mem?.starts_at || null,
            expiresAt: mem?.expires_at || null,
            plan: mem?.plan_type ? formatPlanName(mem.plan_type) : (dbProfile.gender === 'Woman' ? 'Free Pass for Women' : '1 Month VIP Pass'),
            photos: dbProfile.photos && dbProfile.photos.length > 0 ? dbProfile.photos : [],
            registered: dbProfile.created_at ? new Date(dbProfile.created_at).toLocaleDateString() : 'Today'
          };
          }
          try {
            const dbStr = localStorage.getItem('cufy_registered_users');
            let dbUsers = dbStr ? JSON.parse(dbStr) : [];
            dbUsers.unshift(matchedUser);
            localStorage.setItem('cufy_registered_users', JSON.stringify(dbUsers));
          } catch (e) {}
        }
      } catch (e) {}
    }

    // 4. Decision: If user exists in DB -> Direct Login! If new -> Start Onboarding with real info prefilled!
    if (matchedUser) {
      handleLoginSuccess(matchedUser);
    } else {
      handleStartOnboarding({
        authType: 'google',
        email,
        name,
        photo: null,
        photos: [null, null, null, null, null, null],
        authProvider: 'google'
      });
    }
  };

  // Update profile handler (persists edits to active user session and database)
  const handleUpdateProfile = (updatedFields) => {
    setUserProfile(prev => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('cufy_active_user', JSON.stringify(updated));
      saveUserToDatabase(updated);
      return updated;
    });
  };

  // View individual profile
  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setAppTab('profile_detail');
  };

  // Open direct single chat thread
  const handleOpenChat = (profile) => {
    setActiveChatMatch(profile);
    setAppTab('chat');
  };

  // Switch tab safely (resets single chat so clicking Chats bottom tab ALWAYS opens Chat Logs view!)
  const handleTabChange = (tab) => {
    if (tab === 'chat') {
      setActiveChatMatch(null);
    }
    setAppTab(tab);
  };

  const saveMatchToStorage = (profile) => {
    if (!profile || !profile.name) return;
    try {
      const threadId = (profile.id || profile.name).toLowerCase();
      
      // 1. Save match profile to cufy_user_matches array
      const matchesStr = localStorage.getItem('cufy_user_matches');
      let matches = matchesStr ? JSON.parse(matchesStr) : [];
      if (!matches.some(m => (m.id || m.name).toLowerCase() === threadId)) {
        matches.unshift(profile);
        localStorage.setItem('cufy_user_matches', JSON.stringify(matches));
      }

      // 2. Save match thread to cufy_conversations array
      const convsStr = localStorage.getItem('cufy_conversations');
      let convs = convsStr ? JSON.parse(convsStr) : [];
      if (!convs.some(c => c.id === threadId)) {
        const photoUrl = (profile.photos && profile.photos.length > 0)
          ? profile.photos[0]
          : (profile.photo || '/photos/front1.jpg');
        const newThread = {
          id: threadId,
          name: profile.name,
          photo: photoUrl,
          lastMessage: `It's a Match! Say hi to ${profile.name}`,
          time: 'Just now',
          unread: true,
          badge: 'New Match',
          messages: [
            { id: 1, sender: 'them', text: `Hey! Excited to connect with you on Cufy!`, time: 'Just now' }
          ]
        };
        convs.unshift(newThread);
        localStorage.setItem('cufy_conversations', JSON.stringify(convs));
      }
    } catch (err) {
      console.warn('Save match error:', err);
    }
  };

  // Trigger "It's a Match!" celebration screen
  const handleTriggerMatch = (profile) => {
    saveMatchToStorage(profile);
    setMatchedProfile(profile);
  };

  // Action from Match Modal: direct transition into Chat
  const handleSendMessageFromMatch = (profile) => {
    saveMatchToStorage(profile);
    setMatchedProfile(null);
    setActiveChatMatch(profile);
    setAppTab('chat');
  };

  const handleLogout = () => {
    setUserProfile(null);
    localStorage.removeItem('cufy_active_user');
    setIsAdminOpen(false);
    setViewState('welcome');
  };

  const isPendingApproval = userProfile && (userProfile.status === 'pending_approval' || userProfile.status === 'pending') && !userProfile.isAdmin;

  const isVerificationRejected = userProfile && userProfile.status === 'rejected' && !userProfile.isAdmin;

  const isAccountSuspended = Boolean(
    userProfile && 
    (userProfile.status === 'suspended' || userProfile.status === 'deactivated') && 
    !userProfile.isAdmin
  );

  const isMembershipExpired = Boolean(
    userProfile &&
    !userProfile.isAdmin &&
    userProfile.gender !== 'Woman' &&
    (
      userProfile.status === 'expired' ||
      (userProfile.status === 'approved' && userProfile.expiresAt && new Date() >= new Date(userProfile.expiresAt))
    )
  );

  return (
    <div className="app-container">
      
      {/* Viewport & Legal Modal Top Controller Bar */}
      <DeviceFrameToggle 
        isFullWidth={isFullWidth}
        onToggleWidth={() => setIsFullWidth(!isFullWidth)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenAdmin={() => {
          setIsAdminOpen(true);
          if (userProfile?.isAdmin) setViewState('admin');
        }}
      />

      {/* Main App Frame Container */}
      <main className={`device-wrapper ${isFullWidth ? 'full-width' : ''}`}>

        {/* Viewport Screen Content */}
        <div className="screen-viewport">
          
          {/* WELCOME / HERO SCREEN */}
          {viewState === 'welcome' && (
            <WelcomeHero 
              onStartOnboarding={handleStartOnboarding}
              onLoginSuccess={handleLoginSuccess}
              onGoogleAuthSuccess={handleGoogleAuthUser}
            />
          )}

          {/* STEP-BY-STEP ONBOARDING WIZARD */}
          {viewState === 'onboarding' && (
            <OnboardingWizard 
              initialData={userProfile}
              onCompleteOnboarding={handleCompleteOnboarding}
              onCancel={() => setViewState('welcome')}
            />
          )}

          {/* DEDICATED FULL-SCREEN ADMIN PANEL VIEW */}
          {viewState === 'admin' && (
            <AdminPanel 
              isOpen={true}
              onClose={() => {
                setIsAdminOpen(false);
                setViewState('welcome');
              }}
              userProfile={userProfile}
              onLoginSuccess={handleLoginSuccess}
              onLogout={handleLogout}
            />
          )}

          {/* MAIN POST-PAYMENT DATING APPLICATION */}
          {viewState === 'app' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
              
              {/* ACCOUNT SUSPENDED / DEACTIVATED LOCKOUT SCREEN */}
              {isAccountSuspended ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px 24px',
                  textAlign: 'center',
                  background: '#18181B',
                  color: '#FFFFFF',
                  position: 'relative',
                  overflow: 'hidden'
                }} className="animate-fade-in">
                  <div style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '26px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1.5px solid rgba(239, 68, 68, 0.4)',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '22px',
                    boxShadow: '0 12px 32px rgba(239, 68, 68, 0.25)'
                  }}>
                    <ShieldAlert size={44} />
                  </div>

                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '10px', letterSpacing: '-0.5px' }}>
                    Account Deactivated
                  </h1>

                  <p style={{ fontSize: '0.92rem', color: '#A1A1AA', lineHeight: '1.55', maxWidth: '320px', marginBottom: '28px', fontWeight: 500 }}>
                    Hi <b>{userProfile?.name || 'Member'}</b>, your profile has been deactivated by Cufy Administration. You can no longer access matches, chat, or account actions.
                  </p>

                  <div style={{
                    padding: '12px 18px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: '28px',
                    maxWidth: '320px',
                    width: '100%',
                    fontSize: '0.78rem',
                    color: '#71717A'
                  }}>
                    If you believe this is a mistake, please reach out to <span style={{ color: '#E4E4E7', fontWeight: 700 }}>cupid.livepro@gmail.com</span>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="btn-primary" 
                    style={{ 
                      width: '100%', 
                      maxWidth: '280px', 
                      padding: '14px', 
                      background: '#DC2626', 
                      borderColor: '#DC2626',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px' 
                    }}
                  >
                    <LogOut size={18} />
                    Log Out
                  </button>
                </div>
              ) : isMembershipExpired ? (
                <MembershipExpiredModal 
                  userProfile={userProfile} 
                  onRenewSubmitted={(renewedUser) => {
                    setUserProfile(renewedUser);
                    localStorage.setItem('cufy_active_user', JSON.stringify(renewedUser));
                  }}
                  onLogout={handleLogout}
                />
              ) : isVerificationRejected ? (
                <VerificationRejectedModal
                  userProfile={userProfile}
                  onResubmitted={(updatedUser) => {
                    setUserProfile(updatedUser);
                    localStorage.setItem('cufy_active_user', JSON.stringify(updatedUser));
                  }}
                  onEditFullProfile={() => {
                    handleStartOnboarding({
                      ...userProfile,
                      authType: 'edit_rejected'
                    });
                  }}
                  onLogout={handleLogout}
                />
              ) : isPendingApproval ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px 24px',
                  textAlign: 'center',
                  background: '#F5F3EF',
                  position: 'relative',
                  overflow: 'hidden'
                }} className="animate-fade-in">
                  
                  {/* Background graphic */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `url('/photos/haikei2 (2).png')`,
                    backgroundSize: 'cover', opacity: 0.15, pointerEvents: 'none'
                  }}></div>

                  <div style={{
                    width: '80px', height: '80px', borderRadius: '24px',
                    background: '#FEF3C7', color: '#D97706',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '20px', boxShadow: '0 12px 32px rgba(217,119,6,0.2)'
                  }}>
                    <Clock size={40} />
                  </div>

                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#09090B', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                    Account Pending Approval
                  </h1>

                  <p style={{ fontSize: '0.92rem', color: '#52525B', lineHeight: '1.5', maxWidth: '300px', marginBottom: '28px', fontWeight: 500 }}>
                    Hi <b>{userProfile?.name || 'Member'}</b>! Your profile & payment screenshot are under review by Cufy Admin. You will receive a notification as soon as your account is approved.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px', zIndex: 10 }}>
                    <button 
                      onClick={refreshUserSession}
                      className="btn-primary" 
                      style={{ padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <RefreshCw size={18} />
                      Check Approval Status
                    </button>

                    <button 
                      onClick={handleLogout} 
                      style={{ background: 'transparent', border: 'none', color: '#71717A', fontSize: '0.85rem', fontWeight: 700, marginTop: '8px', cursor: 'pointer' }}
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              ) : (
                /* APPROVED ACTIVE APP VIEW */
                <>
                  {/* Home Tab: Swipeable Profile Deck */}
                  {appTab === 'home' && (
                    <SwipeableHomeFeed 
                      userProfile={userProfile}
                      activeFilters={activeFilters}
                      onUpdateProfile={handleUpdateProfile}
                      onOpenChat={handleOpenChat}
                      onSelectProfile={handleSelectProfile}
                      onOpenFilters={() => setIsFilterOpen(true)}
                      onOpenNotifications={() => setIsNotificationOpen(true)}
                      onOpenSettings={() => handleTabChange('settings')}
                      onTriggerMatch={handleTriggerMatch}
                    />
                  )}

                  {/* Likes Tab: Who Liked You & You Liked */}
                  {(appTab === 'likes' || appTab === 'explore') && (
                    <LikesFeed 
                      userProfile={userProfile}
                      onSelectProfile={handleSelectProfile}
                      onOpenChat={(profile) => handleSendMessageFromMatch(profile)}
                    />
                  )}

                  {/* Single Profile Detail View */}
                  {appTab === 'profile_detail' && (
                    <ProfileView 
                      profile={selectedProfile}
                      onBack={() => setAppTab('home')}
                      onOpenChat={handleOpenChat}
                    />
                  )}

                  {/* Chats Tab: Interactive Messages Log & Single Chat */}
                  {appTab === 'chat' && (
                    <ChatDrawer 
                      matchProfile={activeChatMatch}
                      onBack={() => handleTabChange('home')}
                      userProfile={userProfile}
                    />
                  )}

                  {/* Settings Tab */}
                  {appTab === 'settings' && (
                    <SettingsView 
                      userProfile={userProfile}
                      onOpenPrivacy={() => setIsPrivacyOpen(true)}
                      onOpenTerms={() => setIsTermsOpen(true)}
                      onLogout={handleLogout}
                      onOpenAdmin={() => {
                        setIsAdminOpen(true);
                        if (userProfile?.isAdmin) setViewState('admin');
                      }}
                      onUpdateProfile={handleUpdateProfile}
                    />
                  )}

                  {/* Bottom Custom Curved Cutout Navigation Bar */}
                  <BottomNav 
                    activeTab={appTab}
                    onChangeTab={handleTabChange}
                  />
                </>
              )}

              {/* FULL SCREEN ORGANIC WELCOME OVERLAY (Splash + Community Guidelines) */}
              {showWelcomeModal && (
                <WelcomeOverlay 
                  userProfile={userProfile} 
                  onClose={() => setShowWelcomeModal(false)} 
                />
              )}

              {/* IT'S A MATCH OVERLAY SCREEN */}
              {matchedProfile && (
                <MatchModal 
                  matchProfile={matchedProfile}
                  onSendMessage={handleSendMessageFromMatch}
                  onClose={() => setMatchedProfile(null)}
                  userProfile={userProfile}
                />
              )}

              {/* PREFERENCE FILTERS MODAL */}
              <FilterModal 
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApplyFilters={(filters) => {
                  setActiveFilters(filters);
                  setIsFilterOpen(false);
                }}
              />

              {/* NOTIFICATION DRAWER */}
              <NotificationDrawer 
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                onSelectNotification={(notif) => {
                  if (notif.type === 'like') {
                    handleTriggerMatch(INITIAL_DAILY_MATCH);
                  } else if (notif.type === 'chat') {
                    handleTabChange('chat');
                  }
                }}
              />
            </div>
          )}

          {/* 404 CUSTOM ERROR SCREEN */}
          {viewState === '404' && (
            <NotFound onReturnHome={() => setViewState('welcome')} />
          )}

          {/* ADMIN MANAGEMENT PORTAL MODAL (When opened via Settings or button) */}
          {(isAdminOpen && viewState !== 'admin') && (
            <AdminPanel 
              isOpen={true}
              onClose={() => setIsAdminOpen(false)}
              userProfile={userProfile}
              onLoginSuccess={handleLoginSuccess}
              onLogout={handleLogout}
            />
          )}

        </div>
      </main>

      {/* PWA Native App Install Banner */}
      <InstallPwaBanner />

      {/* Cookie Consent Banner */}
      <CookieBanner />

      {/* Compliance Modals */}
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

    </div>
  );
}

