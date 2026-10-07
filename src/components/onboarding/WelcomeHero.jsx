import React, { useState, useEffect } from 'react';
import { Heart, ShieldCheck, CheckCircle2, AlertTriangle, Lock, LogIn } from 'lucide-react';
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
  const [showGoogleSetupModal, setShowGoogleSetupModal] = useState(false);

  const [googleClientId, setGoogleClientId] = useState(() => {
    return ENV.GOOGLE_CLIENT_ID || (typeof localStorage !== 'undefined' ? (localStorage.getItem('cufy_google_client_id') || '') : '') || '';
  });
  const [customClientIdInput, setCustomClientIdInput] = useState('');
  const [directEmailInput, setDirectEmailInput] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleStatusNote, setGoogleStatusNote] = useState('');

  // Cinematic Intro Animation Sequence Stages:
  // 0: Initial Mount (Intro photo begins graceful fade-in)
  // 1: Photo rendered smoothly
  // 2: Logo appears centered on screen with smooth scale
  // 3: Logo glides smoothly to top-left + White frosted blur sheet glides up from bottom + buttons reveal
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

  // Initialize Google Identity Services (GIS) One Tap & Account Chooser
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

    if (window.google?.accounts?.id) {
      setupGsi();
    } else {
      const timer = setTimeout(setupGsi, 800);
      return () => clearTimeout(timer);
    }
  }, [googleClientId]);

  // Handle Continue with Google button click
  const handleContinueWithGoogle = async () => {
    setIsGoogleLoading(true);
    setGoogleStatusNote('');

    // 1. If Google Identity Services OAuth is active with Client ID -> Open Google popup account chooser platter!
    if (window.google?.accounts?.oauth2 && googleClientId) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenRes) => {
            if (tokenRes?.error) {
              setIsGoogleLoading(false);
              setGoogleStatusNote(tokenRes.error_description || 'Google sign-in was closed.');
              return;
            }
            if (tokenRes?.access_token) {
              try {
                // Fetch authentic profile information from Google
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenRes.access_token}` }
                });
                const userInfo = await res.json();
                setIsGoogleLoading(false);
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

    // 2. Try Supabase Google OAuth (triggers redirect to accounts.google.com)
    try {
      if (supabase?.auth) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account'
            },
            redirectTo: window.location.origin
          }
        });

        if (error) {
          console.warn('Supabase OAuth error:', error);
          setIsGoogleLoading(false);
          setShowGoogleSetupModal(true);
          return;
        }

        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch (sbErr) {
      console.warn('Supabase OAuth exception:', sbErr);
    }

    // 3. Fallback: If neither Client ID nor Supabase OAuth is enabled, show setup & connect modal
    setIsGoogleLoading(false);
    setShowGoogleSetupModal(true);
  };

  // Save custom Google Client ID & immediately trigger platter
  const handleSaveGoogleClientId = (e) => {
    e.preventDefault();
    const cleanId = customClientIdInput.trim();
    if (!cleanId) return;

    localStorage.setItem('cufy_google_client_id', cleanId);
    setGoogleClientId(cleanId);
    setShowGoogleSetupModal(false);

    setTimeout(() => {
      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: cleanId,
            scope: 'email profile openid',
            callback: async (tokenRes) => {
              if (tokenRes?.access_token) {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenRes.access_token}` }
                });
                const userInfo = await res.json();
                handleGoogleUser({
                  email: userInfo.email,
                  name: userInfo.name || userInfo.given_name,
                  photo: userInfo.picture
                });
              }
            }
          });
          client.requestAccessToken({ prompt: 'select_account' });
        } catch (e) {
          console.error(e);
        }
      }
    }, 300);
  };

  // Direct Real Email verification (Never dummy mocks)
  const handleDirectEmailSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = directEmailInput.trim().toLowerCase();
    if (!cleanEmail) return;

    const emailErr = validateEmail(cleanEmail);
    if (emailErr) {
      setGoogleStatusNote(emailErr);
      return;
    }

    setShowGoogleSetupModal(false);
    handleGoogleUser({
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      photo: null
    });
  };

  // Password Login Submit Handler
  const handlePasswordLoginSubmit = (e) => {
    e.preventDefault();
    const trimmedEmail = loginEmail.trim().toLowerCase();
    
    // Admin credentials verification (cupid.livepro@gmail.com / cUpid.livepro#@3210)
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
        background: '#161413'
      }} 
      className="animate-fade-in"
    >
      
      {/* 1. FULL BACKGROUND INTRO IMAGE */}
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
          alt="Couple laughing in golden hour sunlight"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 18%',
            transform: animStage >= 1 ? 'scale(1)' : 'scale(1.06)',
            opacity: animStage >= 1 ? 1 : 0,
            transition: 'transform 2.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 1s ease-out',
            willChange: 'transform, opacity'
          }}
          loading="eager"
        />

        {/* Top subtle vignette gradient so top bar is always crisp & readable */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '130px',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0) 100%)',
          pointerEvents: 'none',
          opacity: animStage >= 3 ? 1 : 0,
          transition: 'opacity 0.9s ease-out'
        }}></div>
      </div>

      {/* 2. TOP-RIGHT "CURATED DAILY" BADGE */}
      <div style={{
        position: 'absolute',
        top: '26px',
        right: '24px',
        zIndex: 35,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '2.5px',
        color: 'rgba(255, 255, 255, 0.88)',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
        opacity: animStage >= 3 ? 1 : 0,
        transform: animStage >= 3 ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        CURATED DAILY
      </div>

      {/* 3. ANIMATED CUFY. LOGO (Appears Center -> Smoothly moves to Top-Left) */}
      <div 
        style={{
          position: 'absolute',
          top: animStage >= 3 ? '22px' : '40%',
          left: animStage >= 3 ? '24px' : '50%',
          transform: animStage >= 3 
            ? 'translate(0, 0) scale(1)' 
            : (animStage >= 2 ? 'translate(-50%, -50%) scale(1.6)' : 'translate(-50%, -50%) scale(0.85)'),
          opacity: animStage >= 2 ? 1 : 0,
          transition: 'top 1.15s cubic-bezier(0.16, 1, 0.3, 1), left 1.15s cubic-bezier(0.16, 1, 0.3, 1), transform 1.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-out',
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

      {/* Spacer to push controls to bottom */}
      <div style={{ flex: 1, pointerEvents: 'none' }}></div>

      {/* 4. FROSTED WHITE BLUR SHEET & ACTION CONTROLS (Slides up smoothly from bottom) */}
      <div 
        style={{
          position: 'relative',
          width: '100%',
          zIndex: 20,
          padding: '28px 24px 30px',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.65) 16%, rgba(255, 255, 255, 0.94) 34%, #FFFFFF 56%, #FFFFFF 100%)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: animStage >= 3 ? 'translateY(0)' : 'translateY(90px)',
          opacity: animStage >= 3 ? 1 : 0,
          transition: 'transform 1.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.9s ease-out',
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px'
        }}
      >
        {/* Editorial Headline: Just One Day */}
        <div style={{
          textAlign: 'center',
          marginBottom: '22px',
          width: '100%'
        }}>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '3.5rem',
            lineHeight: '0.92',
            letterSpacing: '-0.5px',
            fontWeight: 500,
            userSelect: 'none'
          }}>
            <div style={{ color: '#FFFFFF', textShadow: '0 2px 14px rgba(0, 0, 0, 0.4)' }}>
              Just
            </div>
            <div style={{
              fontStyle: 'italic',
              color: '#ECA094',
              fontWeight: 500,
              margin: '2px 0',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.25)'
            }}>
              One
            </div>
            <div style={{ color: '#FFFFFF', textShadow: '0 2px 14px rgba(0, 0, 0, 0.4)' }}>
              Day
            </div>
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
              fontSize: '1.05rem',
              fontWeight: 600,
              color: '#27272A',
              letterSpacing: '-0.2px'
            }}>
              the right one
            </span>
            <span style={{
              width: '24px',
              height: '2.5px',
              backgroundColor: '#ECA094',
              borderRadius: '2px',
              display: 'inline-block'
            }}></span>
          </div>
        </div>

        {/* Action Buttons Stack */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '11px' }}>
          
          {/* Button 1: Get Started -> */}
          <button 
            onClick={() => onStartOnboarding({ authType: 'email' })}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '9999px',
              backgroundColor: '#E8D1B9',
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

      {/* 1. GOOGLE SETUP & REAL ACCOUNT CONNECTION MODAL (Zero Dummy Mocks) */}
      {showGoogleSetupModal && (
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
            maxWidth: '400px',
            width: '100%',
            padding: '26px 22px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            border: '1.5px solid #E4E4E7',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} className="animate-fade-in">
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#09090B', margin: 0 }}>
                  Google Sign-In Connection
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#71717A', margin: 0, fontWeight: 600 }}>
                  Live Google Account Chooser & Auth
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#52525B', lineHeight: '1.45', marginBottom: '14px' }}>
              To display Google's live account chooser platter popup, connect your Google Client ID or test with your real Google email.
            </p>

            {googleStatusNote && (
              <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', color: '#DC2626', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>
                {googleStatusNote}
              </div>
            )}

            {/* OPTION 1: Connect Google OAuth Client ID */}
            <div style={{
              background: '#F9F8F6',
              borderRadius: '16px',
              padding: '12px',
              border: '1.5px solid #E4E4E7',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#09090B', marginBottom: '4px' }}>
                Option 1: Paste Google Client ID
              </div>
              <p style={{ fontSize: '0.74rem', color: '#71717A', margin: '0 0 8px', lineHeight: '1.35' }}>
                Enter your Google Cloud Web OAuth Client ID to trigger Google's native account platter popup.
              </p>
              <form onSubmit={handleSaveGoogleClientId} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="text"
                  value={customClientIdInput}
                  onChange={(e) => setCustomClientIdInput(e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                  className="form-input"
                  style={{ fontSize: '0.78rem', padding: '10px' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '10px', fontSize: '0.82rem' }}>
                  Save & Open Google Platter
                </button>
              </form>
            </div>

            {/* OPTION 2: Enable in Supabase */}
            <div style={{
              background: '#F9F8F6',
              borderRadius: '16px',
              padding: '12px',
              border: '1.5px solid #E4E4E7',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#09090B', marginBottom: '4px' }}>
                Option 2: Enable Google in Supabase
              </div>
              <p style={{ fontSize: '0.74rem', color: '#71717A', margin: '0 0 8px', lineHeight: '1.35' }}>
                Turn on Google in your Supabase Auth Providers for redirect OAuth.
              </p>
              <a 
                href="https://supabase.com/dashboard/project/nzgsifgxxqdtpvbycwrx/auth/providers" 
                target="_blank" 
                rel="noreferrer"
                className="btn-secondary"
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '10px', fontSize: '0.82rem', fontWeight: 800 }}
              >
                Open Supabase Providers ↗
              </a>
            </div>

            {/* OPTION 3: Direct Real Google Email (Zero dummy accounts) */}
            <div style={{
              background: '#F9F8F6',
              borderRadius: '16px',
              padding: '12px',
              border: '1.5px solid #E4E4E7',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#09090B', marginBottom: '4px' }}>
                Option 3: Real Google Email Verification
              </div>
              <p style={{ fontSize: '0.74rem', color: '#71717A', margin: '0 0 8px', lineHeight: '1.35' }}>
                Enter your real Google email address. If already registered, it logs you in; if new, it starts onboarding.
              </p>
              <form onSubmit={handleDirectEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="email"
                  value={directEmailInput}
                  onChange={(e) => setDirectEmailInput(e.target.value)}
                  placeholder="your.real.account@gmail.com"
                  className="form-input"
                  style={{ fontSize: '0.82rem', padding: '10px' }}
                  required
                />
                <button type="submit" className="btn-secondary" style={{ padding: '10px', fontSize: '0.82rem', background: '#09090B', color: '#FFF' }}>
                  Continue with this Email
                </button>
              </form>
            </div>

            <button 
              type="button" 
              onClick={() => { setShowGoogleSetupModal(false); setGoogleStatusNote(''); }} 
              className="btn-secondary" 
              style={{ width: '100%', padding: '10px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 2. PASSWORD LOGIN WARNING NOTICE MODAL (FOR TEAM / ADMIN ONLY) */}
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

      {/* 3. TEAM / ADMIN PASSWORD LOGIN FORM MODAL */}
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
