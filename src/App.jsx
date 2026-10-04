import React, { useState, useEffect } from 'react';
import DeviceFrameToggle from './components/common/DeviceFrameToggle';
import CookieBanner from './components/common/CookieBanner';
import PrivacyPolicyModal from './components/common/PrivacyPolicyModal';
import TermsModal from './components/common/TermsModal';
import NotFound from './components/common/NotFound';

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

  // Modals state
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

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
    setViewState('app');
    setAppTab('home');
  };

  // Direct login for existing members
  const handleLoginSuccess = (user) => {
    setUserProfile(user);
    if (user?.isAdmin) {
      setIsAdminOpen(true);
    }
    setViewState('app');
    setAppTab('home');
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
    setViewState('welcome');
  };

  return (
    <div className="app-container">
      
      {/* Viewport & Legal Modal Top Controller Bar */}
      <DeviceFrameToggle 
        isFullWidth={isFullWidth}
        onToggleWidth={() => setIsFullWidth(!isFullWidth)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
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

          {/* MAIN POST-PAYMENT DATING APPLICATION */}
          {viewState === 'app' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
              
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
                  onOpenAdmin={() => setIsAdminOpen(true)}
                />
              )}

              {/* Bottom Custom Curved Cutout Navigation Bar */}
              <BottomNav 
                activeTab={appTab}
                onChangeTab={handleTabChange}
              />

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

          {/* ADMIN MANAGEMENT PORTAL */}
          <AdminPanel 
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
          />

        </div>
      </main>

      {/* Cookie Consent Banner */}
      <CookieBanner />

      {/* Compliance Modals */}
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

    </div>
  );
}
