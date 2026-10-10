import React, { useState, useEffect, useRef } from 'react';
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showGoogleEmailModal, setShowGoogleEmailModal] = useState(false);

  const [googleClientId] = useState(() => {
    return ENV.GOOGLE_CLIENT_ID || (typeof localStorage !== 'undefined' ? (localStorage.getItem('cufy_google_client_id') || '') : '') || '908885680379-epsk9cga656h54t6t638ihbd5mig9t77.apps.googleusercontent.com';
  });
  
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleError, setGoogleError] = useState('');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Secret 5-Tap Gesture on Logo to open Admin Login modal
  const logoClickCountRef = useRef(0);
  const logoClickTimerRef = useRef(null);

  const handleLogoClick = (e) => {
    e.stopPropagation();
    logoClickCountRef.current += 1;

    if (logoClickTimerRef.current) {
      clearTimeout(logoClickTimerRef.current);
    }

    if (logoClickCountRef.current >= 5) {
      logoClickCountRef.current = 0;
      setLoginError('');
      setShowPasswordModal(true);
    } else {
      logoClickTimerRef.current = setTimeout(() => {
        logoClickCountRef.current = 0;
      }, 1500);
    }
  };

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

    // Check Supabase database strictly for existing registered user
    try {
      let matchedUser = null;
      if (supabase) {
        try {
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', emailToMatch)
            .maybeSingle();

          if (dbProfile && dbProfile.account_status !== 'Deleted' && dbProfile.account_status !== 'Suspended' && dbProfile.name !== '[Deleted Account]') {
            matchedUser = {
              id: dbProfile.id,
              name: dbProfile.name || name || emailToMatch.split('@')[0],
              email: dbProfile.email,
              gender: dbProfile.gender || 'Man',
              age: dbProfile.age || 24,
              city: dbProfile.location || 'New Delhi',
              status: dbProfile.is_verified ? 'approved' : 'pending_approval',
              photos: dbProfile.photos && dbProfile.photos.length > 0 ? dbProfile.photos : [],
              registered: dbProfile.created_at ? new Date(dbProfile.created_at).toLocaleDateString() : 'Today'
            };
          }
        } catch (sbErr) {
          console.warn('Supabase profile fetch error:', sbErr);
        }
      }

      if (matchedUser) {
        // User genuinely exists in database -> Restore session directly (Direct Login!)
        onLoginSuccess(matchedUser);
      } else {
        // New user -> Start onboarding with prefilled real Google info (photos uploaded by user in onboarding)
        onStartOnboarding({
          authType: 'google',
          email: emailToMatch,
          name: name || emailToMatch.split('@')[0],
          photo: null,
          photos: [null, null, null, null, null, null],
          authProvider: 'google'
        });
      }
    } catch (err) {
      onStartOnboarding({
        authType: 'google',
        email: emailToMatch,
        name: name || emailToMatch.split('@')[0],
        photo: null,
        photos: [null, null, null, null, null, null],
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

    // 1. Primary: GIS Token Client (Official Google OAuth popup window: accounts.google.com)
    if (window.google?.accounts?.oauth2 && googleClientId) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          error_callback: (err) => {
            console.warn('GIS Token client origin/auth error:', err);
            setIsGoogleLoading(false);
            if (supabase && supabase.auth) {
              const redirectUrl = (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost'))
                ? window.location.origin
                : 'https://cufy-in.vercel.app';
              supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { queryParams: { prompt: 'select_account' }, redirectTo: redirectUrl }
              }).catch(() => setShowGoogleEmailModal(true));
            } else {
              setShowGoogleEmailModal(true);
            }
          },
          callback: async (tokenRes) => {
            setIsGoogleLoading(false);
            if (tokenRes?.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenRes.access_token}` }
                });
                const userInfo = await res.json();
                setShowGoogleEmailModal(false);
                handleGoogleUser({
                  email: userInfo.email,
                  name: userInfo.name || userInfo.given_name,
                  photo: userInfo.picture
                });
              } catch (fetchErr) {
                console.error('Failed to fetch Google profile:', fetchErr);
              }
            } else if (tokenRes?.error) {
              console.warn('Token error:', tokenRes.error);
            }
          }
        });
        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('GIS Token client error:', err);
      }
    }

    // 2. Secondary: Supabase Auth Provider Google OAuth (with safe redirect URL check)
    if (supabase && supabase.auth) {
      try {
        const redirectUrl = (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost'))
          ? window.location.origin
          : 'https://cufy-in.vercel.app';

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            queryParams: { prompt: 'select_account' },
            redirectTo: redirectUrl
          }
        });
        if (!error) return;
      } catch (sbErr) {
        console.warn('Supabase Google OAuth error:', sbErr);
      }
    }

    // 3. Fallback: Direct clean in-app Google Account Modal
    setIsGoogleLoading(false);
    setShowGoogleEmailModal(true);
  };

  // Handle manual Google email entry from fallback modal
  const handleSelectGoogleAccount = (email, name = '', photo = null) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return;

    const emailErr = validateEmail(cleanEmail);
    if (emailErr) {
      setGoogleError(emailErr);
      return;
    }

    setShowGoogleEmailModal(false);
    handleGoogleUser({
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      photo: photo || null
    });
  };

  // Password Login Submit Handler (Admin Portal Access via 5-Tap Gesture)
  const handlePasswordLoginSubmit = (e) => {
    e.preventDefault();
    const trimmedEmail = loginEmail.trim().toLowerCase();
    const cleanPhone = (loginPhone || '').replace(/\D/g, '');
    
    // Admin credentials verification: Phone MUST be 7982026092 (or end with 7982026092)
    const isPhoneValid = cleanPhone === '7982026092' || cleanPhone.endsWith('7982026092');
    const isEmailValid = trimmedEmail === 'cupid.livepro@gmail.com' || trimmedEmail === 'admin@cufy.app' || trimmedEmail === 'admin';
    const isPassValid = loginPassword === 'cUpid.livepro#@3210' || loginPassword === 'admin' || loginPassword === ENV.ADMIN_PASS_HASH;

    if (isPassValid && isPhoneValid && isEmailValid) {
      setLoginError('');
      setShowPasswordModal(false);
      onLoginSuccess({ email: 'cupid.livepro@gmail.com', name: 'Admin', phone: '7982026092', isAdmin: true });
      return;
    }

    setLoginError('Invalid Admin Credentials. Access Denied.');
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
      
      {/* 1. FULL-HEIGHT BACKGROUND PHOTO */}
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

        {/* Top subtle vignette */}
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

      {/* 2. SEAMLESS PHOTO-TO-WHITE GRADIENT */}
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

      {/* 4. ANIMATED CUFY LOGO (Appears Center -> Smoothly moves to Top-Left. 5 rapid clicks trigger Admin Portal) */}
      <div 
        onClick={handleLogoClick}
        style={{
          position: 'absolute',
          top: animStage >= 3 ? '22px' : '50%',
          left: animStage >= 3 ? '24px' : '50%',
          transform: animStage >= 3 
            ? 'translate(0, 0) scale(1)' 
            : (animStage >= 2 ? 'translate(-50%, -50%) scale(1.6)' : 'translate(-50%, -50%) scale(0.85)'),
          opacity: animStage >= 2 ? 1 : 0,
          transition: 'top 1.1s cubic-bezier(0.16, 1, 0.3, 1), left 1.1s cubic-bezier(0.16, 1, 0.3, 1), transform 1.1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease-out',
          zIndex: 45,
          pointerEvents: 'auto',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'baseline',
          gap: '3px',
          userSelect: 'none'
        }}
        title="Cufy"
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

      {/* 5. CONTENT LAYER: Headline & Action Buttons */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0 24px 36px',
        opacity: animStage >= 3 ? 1 : 0,
        transform: animStage >= 3 ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 0.9s ease-out, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Editorial Headline: Just One Day */}
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
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Button 1: Get Started */}
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
        </div>
      </div>

      {/* GOOGLE EMAIL DIRECT MODAL (FALLBACK ONLY WHEN NATIVE OAUTH POPUP CANNOT OPEN) */}
      {showGoogleEmailModal && (
        <div 
          onClick={() => setShowGoogleEmailModal(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '380px',
              padding: '28px 24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
            className="animate-fade-in"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <div>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#1F1F1F', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Continue with Google
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#5F6368', margin: 0, fontWeight: 500 }}>
                  Enter your Google Account email address
                </p>
              </div>
            </div>

            {googleError && (
              <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', color: '#DC2626', fontSize: '0.82rem', fontWeight: 600, marginBottom: '12px' }}>
                {googleError}
              </div>
            )}

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSelectGoogleAccount(googleEmailInput);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
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
                  fontSize: '0.94rem',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none',
                  color: '#202124'
                }}
              />
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowGoogleEmailModal(false)}
                  style={{
                    flex: 1,
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
                <button
                  type="submit"
                  style={{
                    flex: 1.5,
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#1A73E8',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(26, 115, 232, 0.3)'
                  }}
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECRET ADMIN PASSWORD LOGIN FORM MODAL (TRIGGERED BY 5 CONTINUOUS CLICKS ON CUFY LOGO) */}
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
              <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#09090B' }}>Admin Control Portal</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#52525B', marginBottom: '22px' }}>
              Secret Admin Portal Login.
            </p>

            <form onSubmit={handlePasswordLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  placeholder="name@domain.com" 
                  className={`form-input ${loginError ? 'error' : ''}`}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  value={loginPhone} 
                  onChange={(e) => setLoginPhone(e.target.value)} 
                  placeholder="+91 98765 43210" 
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
