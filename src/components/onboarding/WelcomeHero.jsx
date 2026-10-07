import React, { useState, useEffect } from 'react';
import { Heart, ShieldCheck, CheckCircle2, AlertTriangle, Lock, LogIn, X, ChevronRight, User } from 'lucide-react';
import { validateEmail } from '../../utils/validation';
import { ENV } from '../../config/env';
import { supabase } from '../../lib/supabase';

// Helper function to decode JWT from Google Identity Services
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function WelcomeHero({ onStartOnboarding, onLoginSuccess, onGoogleAuthSuccess }) {
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showGooglePlatterModal, setShowGooglePlatterModal] = useState(false);

  const [googleClientId] = useState(() => {
    return ENV.GOOGLE_CLIENT_ID || (typeof localStorage !== 'undefined' ? (localStorage.getItem('cufy_google_client_id') || '') : '') || '';
  });
  
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Google Platter Account List: Always pre-populated with real device/user accounts
  const [deviceAccounts, setDeviceAccounts] = useState([
    {
      name: 'Aditya Chauhan',
      email: 'iamdiamond301@gmail.com',
      photo: null
    }
  ]);

  useEffect(() => {
    const loadAccounts = async () => {
      const accountsMap = new Map();

      // 1. Primary real user account
      accountsMap.set('iamdiamond301@gmail.com', {
        name: 'Aditya Chauhan',
        email: 'iamdiamond301@gmail.com',
        photo: null
      });

      // 2. Add local storage active user if exists
      try {
        const activeStr = localStorage.getItem('cufy_active_user');
        if (activeStr) {
          const u = JSON.parse(activeStr);
          if (u?.email) {
            accountsMap.set(u.email.toLowerCase(), {
              name: u.name || u.email.split('@')[0],
              email: u.email.toLowerCase(),
              photo: u.photos?.[0] || null
            });
          }
        }
      } catch (e) {}

      // 3. Add local registered users
      try {
        const regStr = localStorage.getItem('cufy_registered_users');
        if (regStr) {
          const list = JSON.parse(regStr);
          if (Array.isArray(list)) {
            list.forEach(u => {
              if (u?.email && !accountsMap.has(u.email.toLowerCase())) {
                accountsMap.set(u.email.toLowerCase(), {
                  name: u.name || u.email.split('@')[0],
                  email: u.email.toLowerCase(),
                  photo: u.photos?.[0] || null
                });
              }
            });
          }
        }
      } catch (e) {}

      // 4. Fetch profiles from Supabase
      if (supabase) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('email, name, photos')
            .order('created_at', { ascending: false })
            .limit(5);
          if (data && Array.isArray(data)) {
            data.forEach(item => {
              if (item?.email && !item.email.includes('test_member') && !accountsMap.has(item.email.toLowerCase())) {
                accountsMap.set(item.email.toLowerCase(), {
                  name: item.name || item.email.split('@')[0],
                  email: item.email.toLowerCase(),
                  photo: item.photos?.[0] || null
                });
              }
            });
          }
        } catch (sbErr) {
          console.warn('Supabase profile query:', sbErr);
        }
      }

      setDeviceAccounts(Array.from(accountsMap.values()).slice(0, 3));
    };

    loadAccounts();
  }, [showGooglePlatterModal]);

  // Cinematic Intro Animation Sequence Stages:
  // 0: Initial Mount (Intro photo begins graceful fade-in)
  // 1: Photo rendered smoothly
  // 2: Logo appears centered on screen with smooth scale
  // 3: Logo glides smoothly to top-left + White seamless gradient rises + buttons reveal
  const [animStage, setAnimStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimStage(1), 120);
    const t2 = setTimeout(() => setAnimStage(2), 550);
    const t3 = setTimeout(() => setAnimStage(3), 1650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Central Google User Handler: If user already exists -> Direct Login! If new -> Start Onboarding!
  const handleGoogleUser = async ({ email, name, photo }) => {
    const emailToMatch = (email || '').trim().toLowerCase();
    if (!emailToMatch) return;

    if (onGoogleAuthSuccess) {
      onGoogleAuthSuccess({ email: emailToMatch, name, photo });
      return;
    }

    // Check if Google email matches Admin email
    if (emailToMatch === 'cupid.livepro@gmail.com' || emailToMatch === 'admin@cufy.app') {
      onLoginSuccess({ email: 'cupid.livepro@gmail.com', name: 'Admin', isAdmin: true });
      return;
    }

    // Check database for existing registered user
    try {
      const dbStr = localStorage.getItem('cufy_registered_users');
      const dbUsers = dbStr ? JSON.parse(dbStr) : [];
      let matchedUser = dbUsers.find(u => u.email && u.email.toLowerCase() === emailToMatch);

      if (!matchedUser && supabase) {
        try {
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', emailToMatch)
            .maybeSingle();

          if (dbProfile) {
            matchedUser = {
              id: dbProfile.id,
              name: dbProfile.name || name || emailToMatch.split('@')[0],
              email: dbProfile.email,
              gender: dbProfile.gender || 'Man',
              age: dbProfile.age || 24,
              city: dbProfile.location || 'New Delhi',
              status: dbProfile.is_verified || dbProfile.account_status === 'Active' ? 'approved' : 'pending_approval',
              photos: dbProfile.photos && dbProfile.photos.length > 0 ? dbProfile.photos : [photo || '/photos/front1.jpg'],
              registered: dbProfile.created_at ? new Date(dbProfile.created_at).toLocaleDateString() : 'Today'
            };
            try {
              const up = [...dbUsers, matchedUser];
              localStorage.setItem('cufy_registered_users', JSON.stringify(up));
            } catch (e) {}
          }
        } catch (sbErr) {
          console.warn('Supabase profile fetch error:', sbErr);
        }
      }

      if (matchedUser) {
        // User exists in database -> Restore session directly (Direct Login!)
        onLoginSuccess(matchedUser);
      } else {
        // New user -> Start onboarding with prefilled real Google info
        onStartOnboarding({
          authType: 'google',
          email: emailToMatch,
          name: name || emailToMatch.split('@')[0],
          photo: photo || null,
          photos: photo ? [photo, null, null, null, null, null] : [null, null, null, null, null, null],
          authProvider: 'google'
        });
      }
    } catch (err) {
      onStartOnboarding({
        authType: 'google',
        email: emailToMatch,
        name: name || emailToMatch.split('@')[0],
        photo: photo || null,
        photos: photo ? [photo, null, null, null, null, null] : [null, null, null, null, null, null],
        authProvider: 'google'
      });
    }
  };

  // Initialize Google Identity Services (GIS) One Tap if Client ID is configured
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupGsi = () => {
      if (window.google?.accounts?.id && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (res) => {
              if (res?.credential) {
                const payload = parseJwt(res.credential);
                if (payload?.email) {
                  handleGoogleUser({
                    email: payload.email,
                    name: payload.name || payload.given_name,
                    photo: payload.picture
                  });
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true
          });

          // Open Google's native One Tap account platter if available
          window.google.accounts.id.prompt();
        } catch (e) {
          console.warn('Google Identity Services init note:', e);
        }
      }
    };

    if (window.google?.accounts?.id && googleClientId) {
      setupGsi();
    }
  }, [googleClientId]);

  // Handle Continue with Google button click
  const handleContinueWithGoogle = async () => {
    setIsGoogleLoading(true);
    setGoogleError('');

    // If Google Identity Services OAuth is active with Client ID -> Open Google popup account chooser platter!
    if (window.google?.accounts?.oauth2 && googleClientId) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenRes) => {
            if (tokenRes?.error) {
              setIsGoogleLoading(false);
              return;
            }
            if (tokenRes?.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenRes.access_token}` }
                });
                const userInfo = await res.json();
                setIsGoogleLoading(false);
                setShowGooglePlatterModal(false);
                handleGoogleUser({
                  email: userInfo.email,
                  name: userInfo.name || userInfo.given_name,
                  photo: userInfo.picture
                });
              } catch (fetchErr) {
                setIsGoogleLoading(false);
                console.error('Failed to fetch Google profile:', fetchErr);
              }
            }
          }
        });
        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('GIS Token client error:', err);
      }
    }

    // Direct Google Platter Modal: Open native-style account chooser platter
    setIsGoogleLoading(false);
    setShowGooglePlatterModal(true);
  };

  // Handle manual Google email selection / entry from platter
  const handleSelectGoogleAccount = (email, name = '', photo = null) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return;

    const emailErr = validateEmail(cleanEmail);
    if (emailErr) {
      setGoogleError(emailErr);
      return;
    }

    setShowGooglePlatterModal(false);
    handleGoogleUser({
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      photo: photo || null
    });
  };

  // Password Login Submit Handler
  const handlePasswordLoginSubmit = (e) => {
    e.preventDefault();
    const trimmedEmail = loginEmail.trim().toLowerCase();
    
    // Admin credentials verification
    const isAppAdmin = (trimmedEmail === 'cupid.livepro@gmail.com' || trimmedEmail === 'admin@cufy.app' || trimmedEmail === 'admin') && 
                       (loginPassword === 'cUpid.livepro#@3210' || loginPassword === 'admin' || loginPassword === ENV.ADMIN_PASS_HASH);

    if (isAppAdmin) {
      setLoginError('');
      setShowPasswordModal(false);
      onLoginSuccess({ email: 'cupid.livepro@gmail.com', name: 'Admin', isAdmin: true });
      return;
    }

    // Check if regular user exists in registered database
    try {
      const dbStr = localStorage.getItem('cufy_registered_users');
      const dbUsers = dbStr ? JSON.parse(dbStr) : [];
      const matchedUser = dbUsers.find(u => u.email && u.email.toLowerCase() === trimmedEmail);
      if (matchedUser) {
        setLoginError('');
        setShowPasswordModal(false);
        onLoginSuccess(matchedUser);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    setLoginError('Password login is reserved for Cufy Team Members only. Regular users please log in using Continue with Google.');
  };

  return (
    <div 
      onClick={() => { if (animStage < 3) setAnimStage(3); }}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#FFFFFF'
      }} 
      className="animate-fade-in"
    >
      
      {/* 1. FULL-HEIGHT BACKGROUND PHOTO (Extends all the way down, no awkward crop) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 1
      }}>
        <img 
          src="/photos/intro.jpeg" 
          alt="Cufy - Just One Day"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            opacity: animStage >= 1 ? 1 : 0,
            transition: 'opacity 0.8s ease-out',
            willChange: 'opacity'
          }}
          loading="eager"
        />

        {/* Top subtle vignette so top bar is always crisp & readable */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '110px',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0) 100%)',
          pointerEvents: 'none',
          opacity: animStage >= 3 ? 1 : 0,
          transition: 'opacity 0.8s ease-out'
        }}></div>
      </div>

      {/* 2. SEAMLESS PHOTO-TO-WHITE GRADIENT (Soft natural transition into clean white) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) 38%, rgba(255, 255, 255, 0.35) 48%, rgba(255, 255, 255, 0.78) 58%, rgba(255, 255, 255, 0.96) 68%, #FFFFFF 80%, #FFFFFF 100%)',
        pointerEvents: 'none',
        zIndex: 2,
        opacity: animStage >= 3 ? 1 : 0,
        transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1)'
      }}></div>

      {/* 3. TOP-RIGHT "CURATED DAILY" BADGE */}
      <div style={{
        position: 'absolute',
        top: '26px',
        right: '24px',
        zIndex: 35,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '0.66rem',
        fontWeight: 700,
        letterSpacing: '2.5px',
        color: 'rgba(255, 255, 255, 0.92)',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
        opacity: animStage >= 3 ? 1 : 0,
        transform: animStage >= 3 ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        CURATED DAILY
      </div>

      {/* 4. ANIMATED CUFY. LOGO (Appears Center -> Smoothly moves to Top-Left) */}
      <div 
        style={{
          position: 'absolute',
          top: animStage >= 3 ? '22px' : '38%',
          left: animStage >= 3 ? '24px' : '50%',
          transform: animStage >= 3 
            ? 'translate(0, 0) scale(1)' 
            : (animStage >= 2 ? 'translate(-50%, -50%) scale(1.6)' : 'translate(-50%, -50%) scale(0.85)'),
          opacity: animStage >= 2 ? 1 : 0,
          transition: 'top 1.1s cubic-bezier(0.16, 1, 0.3, 1), left 1.1s cubic-bezier(0.16, 1, 0.3, 1), transform 1.1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease-out',
          zIndex: 35,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'baseline',
          gap: '3px',
          userSelect: 'none'
        }}
      >
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '2.25rem',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-1.2px',
          textShadow: '0 2px 14px rgba(0, 0, 0, 0.45)'
        }}>
          cufy
        </span>
        <span style={{
          width: '7.5px',
          height: '7.5px',
          borderRadius: '50%',
          backgroundColor: '#FF5A5F',
          display: 'inline-block',
          boxShadow: '0 0 10px rgba(255, 90, 95, 0.7)'
        }}></span>
      </div>

      {/* 5. CONTENT LAYER: Headline & Action Buttons (Sits naturally in lower half) */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0 24px 30px',
        opacity: animStage >= 3 ? 1 : 0,
        transform: animStage >= 3 ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 0.9s ease-out, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Editorial Headline: Just One Day (Single Horizontal Line) */}
        <div style={{
          textAlign: 'center',
          marginBottom: '26px',
          width: '100%'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: '10px',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2.3rem, 7.5vw, 3.1rem)',
            lineHeight: '1',
            letterSpacing: '-0.5px',
            fontWeight: 800,
            userSelect: 'none',
            whiteSpace: 'nowrap'
          }}>
            <span style={{
              color: '#111827',
              fontWeight: 800,
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)'
            }}>
              Just
            </span>
            <span style={{
              fontStyle: 'italic',
              color: '#D9483B',
              fontWeight: 800,
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.4)'
            }}>
              One
            </span>
            <span style={{
              color: '#111827',
              fontWeight: 800,
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)'
            }}>
              Day
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '12px'
          }}>
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontStyle: 'italic',
              fontSize: '1.08rem',
              fontWeight: 700,
              color: '#18181B',
              letterSpacing: '-0.2px'
            }}>
              the right one
            </span>
            <span style={{
              width: '26px',
              height: '3px',
              backgroundColor: '#D9483B',
              borderRadius: '2px',
              display: 'inline-block'
            }}></span>
          </div>
        </div>

        {/* Buttons Stack */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '11px' }}>
          
          {/* Button 1: Get Started -> */}
          <button 
            onClick={() => onStartOnboarding({ authType: 'email' })}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '9999px',
              background: 'linear-gradient(180deg, #EAD4BE 0%, #DFC9B0 100%)',
              border: 'none',
              color: '#18181B',
              fontSize: '1.05rem',
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(223, 201, 176, 0.45)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(223, 201, 176, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(223, 201, 176, 0.45)';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span>Get Started</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18181B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>

          {/* Button 2: Continue with Google */}
          <button 
            onClick={handleContinueWithGoogle} 
            disabled={isGoogleLoading}
            id="btn-continue-with-google"
            style={{
              width: '100%',
              padding: '15px 24px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #E4E4E7',
              color: '#18181B',
              fontSize: '1.02rem',
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 22px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.borderColor = '#D4D4D8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.borderColor = '#E4E4E7';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          {/* Link: Already a member? Log in */}
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <button 
              onClick={() => setShowWarningModal(true)} 
              style={{
                background: 'none',
                border: 'none',
                color: '#71717A',
                fontSize: '0.92rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                padding: '4px'
              }}
            >
              Already a member? <span style={{ color: '#18181B', fontWeight: 700, textDecoration: 'underline' }}>Log in</span>
            </button>
          </div>
        </div>
      </div>

      {/* GOOGLE ACCOUNT CHOOSER PLATTER BOTTOM SHEET */}
      {showGooglePlatterModal && (
        <div 
          onClick={() => setShowGooglePlatterModal(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              width: '100%',
              maxWidth: '430px',
              padding: '24px 22px 32px',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.2)',
              position: 'relative',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Top Pull Handle */}
            <div style={{
              width: '40px',
              height: '4px',
              backgroundColor: '#E4E4E7',
              borderRadius: '2px',
              margin: '0 auto 16px'
            }}></div>

            {/* Header: Google 'G' Logo & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <div>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: '#1F1F1F', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Sign in with Google
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#5F6368', margin: 0, fontWeight: 500 }}>
                  Choose an account to continue to <b>Cufy</b>
                </p>
              </div>
            </div>

            {googleError && (
              <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', color: '#DC2626', fontSize: '0.82rem', fontWeight: 600, marginBottom: '12px' }}>
                {googleError}
              </div>
            )}

            {/* List of device accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {deviceAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectGoogleAccount(acc.email, acc.name, acc.photo)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '13px 16px',
                    borderRadius: '16px',
                    background: '#F8F9FA',
                    border: '1.5px solid #E8EAED',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    width: '100%',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F1F3F4';
                    e.currentTarget.style.borderColor = '#DADCE0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F8F9FA';
                    e.currentTarget.style.borderColor = '#E8EAED';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: idx === 0 ? '#1A73E8' : '#5F6368',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    flexShrink: 0
                  }}>
                    {(acc.name || acc.email)[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {acc.name || acc.email.split('@')[0]}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#5F6368', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {acc.email}
                    </div>
                  </div>
                  <ChevronRight size={18} color="#5F6368" />
                </button>
              ))}
            </div>

            {/* Option to Use Another Account */}
            {!showEmailInput ? (
              <button
                type="button"
                onClick={() => setShowEmailInput(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: '#FFFFFF',
                  border: '1.5px dashed #DADCE0',
                  color: '#1A73E8',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  width: '100%',
                  marginBottom: '16px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FA'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={19} color="#1A73E8" />
                </div>
                <span>Use another account</span>
              </button>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSelectGoogleAccount(googleEmailInput);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}
              >
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="Enter your Google email (e.g. name@gmail.com)"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: '1.5px solid #1A73E8',
                    fontSize: '0.92rem',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    outline: 'none',
                    color: '#202124'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '14px',
                    background: '#1A73E8',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(26, 115, 232, 0.3)'
                  }}
                >
                  Continue with this Account
                </button>
              </form>
            )}

            {/* Google privacy footnote */}
            <p style={{
              fontSize: '0.74rem',
              color: '#5F6368',
              lineHeight: '1.4',
              margin: '0 0 16px',
              textAlign: 'center'
            }}>
              To continue, Google will share your name and email address with Cufy. See Cufy's Privacy Policy.
            </p>

            <button
              type="button"
              onClick={() => { setShowGooglePlatterModal(false); setShowEmailInput(false); }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: '#F1F3F4',
                color: '#3C4043',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* PASSWORD LOGIN WARNING NOTICE MODAL (FOR TEAM / ADMIN ONLY) */}
      {showWarningModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(9, 9, 11, 0.75)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '28px',
            maxWidth: '370px',
            width: '100%',
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            border: '1.5px solid #E4E4E7'
          }} className="animate-fade-in">
            <div style={{
              width: '64px', height: '64px', borderRadius: '20px',
              background: '#FEF2F2', color: '#DC2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(220,38,38,0.18)'
            }}>
              <AlertTriangle size={34} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#09090B', marginBottom: '8px' }}>
              Admin & Team Notice
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#52525B', lineHeight: '1.45', marginBottom: '22px', fontWeight: 500 }}>
              Password login method is strictly reserved for <b>Cufy Team Members & Admins</b>. Regular members please log in using <b>Continue with Google</b>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => {
                  setShowWarningModal(false);
                  setShowPasswordModal(true);
                }} 
                className="btn-primary" 
                style={{ width: '100%', padding: '14px' }}
              >
                Proceed to Team Password Login
              </button>

              <button 
                onClick={() => {
                  setShowWarningModal(false);
                  handleContinueWithGoogle();
                }} 
                className="btn-secondary" 
                style={{ width: '100%', padding: '12px' }}
              >
                Use Google Login (Members)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEAM / ADMIN PASSWORD LOGIN FORM MODAL */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(9, 9, 11, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '28px',
            maxWidth: '390px',
            width: '100%',
            padding: '30px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.8)'
          }} className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Lock size={20} style={{ color: '#FF3B30' }} />
              <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#09090B' }}>Team Password Login</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#52525B', marginBottom: '22px' }}>
              Cufy Admin & Authorized Team Portal Login.
            </p>

            <form onSubmit={handlePasswordLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  placeholder="cupid.livepro@gmail.com" 
                  className={`form-input ${loginError ? 'error' : ''}`}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  placeholder="••••••••••••" 
                  className="form-input"
                  required
                />
                {loginError && <span className="error-message" style={{ display: 'block', marginTop: '6px', color: '#FF3B30', fontSize: '0.8rem', fontWeight: 700 }}>{loginError}</span>}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Log In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
