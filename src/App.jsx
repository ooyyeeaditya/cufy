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

import { INITIAL_DAILY_MATCH } from './data/mockProfiles';
import { analytics } from './utils/analytics';
import { Clock, ShieldCheck, Sparkles, RefreshCw, X, LogOut } from 'lucide-react';
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Save user profile to persistent registered database in localStorage
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
        status: user.status || (user.gender === 'Woman' ? 'approved' : 'pending_approval'),
        plan: user.plan || (user.gender === 'Woman' ? 'Free Pass for Women' : '1 Month VIP Pass'),
        registered: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        photos: (user.photos && user.photos.filter(p => Boolean(p)).length > 0) ? user.photos : ['/photos/front1.jpg'],
        paymentProofUrl: user.paymentProofUrl || user.paymentProof || '/photos/couple1.jpg',
        matches: user.matches || [],
        payments: user.payments || [{ plan: user.plan || '1 Month Pass', amount: '₹799', date: 'Today', status: user.status === 'approved' ? 'Approved' : 'Pending', screenshot: user.paymentProofUrl || '/photos/couple1.jpg' }]
      };

      if (existingIdx >= 0) {
        dbUsers[existingIdx] = { ...dbUsers[existingIdx], ...record };
      } else {
        dbUsers.unshift(record);
      }
      localStorage.setItem('cufy_registered_users', JSON.stringify(dbUsers));
    } catch (err) {
      console.error('Database save error:', err);
    }
  };

  // Sync user profile state from localStorage without forcing logout
  const refreshUserSession = () => {
    try {
      const savedUser = localStorage.getItem('cufy_active_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUserProfile(parsed);
        if (parsed?.isAdmin) {
          setViewState('admin');
          setIsAdminOpen(true);
        } else {
          setViewState('app');
          setIsAdminOpen(false);
        }
      }
    } catch (err) {
      console.error('Session restore error:', err);
    }
  };

  // Restore persistent login session from localStorage on app launch & listen for approval events
  useEffect(() => {
    refreshUserSession();

    const handleApprovedEvent = () => {
      refreshUserSession();
    };

    window.addEventListener('cufy_user_approved', handleApprovedEvent);
    return () => {
      window.removeEventListener('cufy_user_approved', handleApprovedEvent);
    };
  }, []);

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
      if (completedData.status === 'approved' || completedData.gender === 'Woman') {
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
      if (user.gender === 'Woman' || user.status === 'approved') {
        setShowWelcomeModal(true);
      }
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

  // Trigger "It's a Match!" celebration screen
  const handleTriggerMatch = (profile) => {
    setMatchedProfile(profile);
  };

  // Action from Match Modal: direct transition into Chat
  const handleSendMessageFromMatch = (profile) => {
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

  const isPendingApproval = userProfile && userProfile.gender !== 'Woman' && userProfile.status === 'pending_approval' && !userProfile.isAdmin;

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
              
              {/* PENDING ADMIN APPROVAL LOCKED SCREEN (For Men until Admin approves) */}
              {isPendingApproval ? (
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

              {/* WELCOME POPUP MODAL (For Women & Approved Members) */}
              {showWelcomeModal && (
                <div style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(9, 9, 11, 0.75)',
                  backdropFilter: 'blur(12px)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px'
                }}>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '28px',
                    maxWidth: '360px',
                    width: '100%',
                    padding: '28px 24px',
                    textAlign: 'center',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
                    border: '1.5px solid #E4E4E7'
                  }} className="animate-fade-in">
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '20px',
                      background: '#ECFDF5', color: '#10B981',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(16,185,129,0.2)'
                    }}>
                      <Sparkles size={32} />
                    </div>

                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#09090B', marginBottom: '8px' }}>
                      Welcome to Cufy! ✨
                    </h3>

                    <p style={{ fontSize: '0.9rem', color: '#52525B', lineHeight: '1.45', marginBottom: '24px' }}>
                      {userProfile?.gender === 'Woman' 
                        ? 'Your profile is active with 100% free VIP access. Enjoy discovering authentic connections!' 
                        : 'Your account is approved! Explore profiles and start matching now.'}
                    </p>

                    <button 
                      onClick={() => setShowWelcomeModal(false)} 
                      className="btn-black-pill"
                      style={{ width: '100%', padding: '14px' }}
                    >
                      Explore Matches Now
                    </button>
                  </div>
                </div>
              )}

              {/* IT'S A MATCH OVERLAY SCREEN */}
              {matchedProfile && (
                <MatchModal 
                  matchProfile={matchedProfile}
                  onSendMessage={handleSendMessageFromMatch}
                  onClose={() => setMatchedProfile(null)}
                />
              )}

              {/* PREFERENCE FILTERS MODAL */}
              <FilterModal 
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApplyFilters={(filters) => {
                  console.log('Applied filters:', filters);
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

