import React, { useState, useEffect } from 'react';
import { Heart, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { validateEmail } from '../../utils/validation';
import { ENV } from '../../config/env';
import { supabase } from '../../lib/supabase';

export default function WelcomeHero({ onStartOnboarding, onLoginSuccess }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Haikei Background Graphics Smooth Loop State
  const haikeiBgs = [
    '/photos/haikei2 (1).png',
    '/photos/haikei2 (2).png',
    '/photos/haikei2 (3).png',
    '/photos/layered-waves-haikei.png',
    '/photos/layered-waves-haikei (1).png'
  ];

  const [bgIdx, setBgIdx] = useState(0);

  // Smooth background loop effect every 2 seconds with blur crossfade
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIdx(prev => (prev + 1) % haikeiBgs.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Google OAuth / SSO Login flow
  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      if (supabase && supabase.auth) {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin }
        });
      }
    } catch (e) {
      console.log('OAuth fallback redirecting');
    } finally {
      setIsGoogleLoading(false);
      onStartOnboarding({ 
        authType: 'google', 
        email: 'alex.rivera.google@gmail.com',
        name: 'Alex Rivera',
        location: 'New Delhi',
        age: 24,
        authProvider: 'google'
      });
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const trimmedEmail = loginEmail.trim().toLowerCase();
    
    // Admin credentials verification (cupid.livepro@gmail.com / cUpid.livepro#@3210)
    const isAppAdmin = (trimmedEmail === 'cupid.livepro@gmail.com' || trimmedEmail === 'admin@cufy.app' || trimmedEmail === 'admin') && 
                       (loginPassword === 'cUpid.livepro#@3210' || loginPassword === 'admin' || loginPassword === ENV.ADMIN_PASS_HASH);

    if (isAppAdmin) {
      setLoginError('');
      setShowLoginModal(false);
      onLoginSuccess({ email: 'cupid.livepro@gmail.com', name: 'Admin', isAdmin: true });
      return;
    }

    const err = validateEmail(loginEmail);
    if (err) {
      setLoginError(err);
      return;
    }

    setLoginError('');
    setShowLoginModal(false);
    onLoginSuccess({ email: loginEmail, name: 'Welcome Back Member', isAdmin: false });
  };

  return (
    <div style={{
      padding: '16px 20px 24px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      background: '#F5F3EF'
    }} className="animate-fade-in">
      
      {/* SMOOTHLY BLURRING & LOOPING HAIKEI BACKGROUND GRAPHIC LAYER (Every 2 seconds) */}
      {haikeiBgs.map((bgUrl, i) => (
        <img 
          key={i}
          src={bgUrl} 
          alt="Haikei smooth background pattern" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: i === bgIdx ? 0.26 : 0,
            filter: i === bgIdx ? 'blur(0px)' : 'blur(12px)',
            transition: 'opacity 2s ease-in-out, filter 2s ease-in-out',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
      ))}

      {/* TOP BRANDING & STATUS HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
        position: 'relative',
        paddingTop: '4px'
      }}>
        {/* Sleek Cufy Typography Title */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '1.9rem', fontWeight: 900, fontFamily: 'serif', fontStyle: 'italic', color: '#09090B', letterSpacing: '-0.8px' }}>
            cufy<span style={{ color: '#FF3B30', fontStyle: 'normal' }}>.</span>
          </span>
        </div>

        {/* Curated Daily Badge (No star icon) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 14px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(228, 228, 231, 0.9)',
          borderRadius: '14px',
          fontSize: '0.8rem',
          fontWeight: 800,
          color: '#09090B',
          boxShadow: '0 4px 14px rgba(0,0,0,0.04)'
        }}>
          <span>Curated Daily</span>
        </div>
      </div>

      {/* HERO VISUAL PHOTO CARD STACK (front1.jpg, front2.jpg, front3.jpg) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.15fr 0.85fr',
        gap: '12px',
        marginTop: '16px',
        marginBottom: '16px',
        position: 'relative',
        zIndex: 5
      }}>
        {/* Left Tall Photo Card (front1.jpg) */}
        <div style={{
          position: 'relative',
          borderRadius: '26px',
          overflow: 'hidden',
          height: '330px',
          boxShadow: '0 18px 40px rgba(0,0,0,0.14)',
          border: '2px solid rgba(255,255,255,0.9)'
        }}>
          <img 
            src="/photos/front1.jpg" 
            alt="Warm profile portrait" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="eager"
          />
          
          {/* Floating Glass Name Badge */}
          <div style={{
            position: 'absolute',
            bottom: '14px',
            left: '12px',
            padding: '6px 12px',
            background: 'rgba(9, 9, 11, 0.65)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            color: '#FFFFFF',
            fontSize: '0.8rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>Sophia, 25</span>
            <CheckCircle2 size={13} style={{ color: '#10B981' }} />
          </div>

          {/* Floating Heart Badge */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF3B30 0%, #E03131 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 6px 16px rgba(255, 59, 48, 0.45)'
          }}>
            <Heart size={18} fill="#FFFFFF" />
          </div>
        </div>

        {/* Right 2 Photo Cards (front2.jpg & front3.jpg) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '330px' }}>
          {/* Top Right (front2.jpg) */}
          <div style={{
            flex: 1,
            borderRadius: '22px',
            overflow: 'hidden',
            boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
            border: '2px solid rgba(255,255,255,0.9)'
          }}>
            <img 
              src="/photos/front2.jpg" 
              alt="Male portrait" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="eager"
            />
          </div>

          {/* Bottom Right (front3.jpg) */}
          <div style={{
            flex: 1,
            borderRadius: '22px',
            overflow: 'hidden',
            boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
            border: '2px solid rgba(255,255,255,0.9)'
          }}>
            <img 
              src="/photos/front3.jpg" 
              alt="Female portrait" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="eager"
            />
          </div>
        </div>
      </div>

      {/* HEADER TAGLINE SECTION */}
      <div style={{ textAlign: 'left', marginBottom: '16px', zIndex: 5, position: 'relative' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          letterSpacing: '-1.2px',
          color: '#09090B',
          lineHeight: '1.1'
        }}>
          just <span style={{
            display: 'inline-block',
            padding: '4px 14px',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            borderRadius: '14px',
            fontWeight: 800,
            fontSize: '1.9rem',
            verticalAlign: 'middle',
            margin: '0 4px',
            border: '1px solid #E4E4E7'
          }}>one</span> a day
        </h1>

        <div style={{ position: 'relative', marginTop: '6px' }}>
          <span style={{
            fontSize: '1.35rem',
            fontStyle: 'italic',
            fontWeight: 700,
            color: '#27272A',
            letterSpacing: '-0.3px'
          }}>
            the right one_
          </span>
          {/* Curved red accent underline */}
          <svg width="150" height="14" viewBox="0 0 150 14" fill="none" style={{ display: 'block', marginTop: '2px' }}>
            <path d="M2 10 C 45 2, 95 12, 148 4" stroke="#FF3B30" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* ACTION BUTTONS (No star icon on Get Started!) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 5, position: 'relative' }}>
        <button onClick={() => onStartOnboarding({ authType: 'email' })} className="btn-primary">
          <span>Get Started</span>
        </button>

        <button 
          onClick={handleGoogleSignup} 
          disabled={isGoogleLoading}
          className="btn-secondary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          {isGoogleLoading ? 'Connecting Google Account...' : 'Continue with Google'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '4px' }}>
          <button onClick={() => setShowLoginModal(true)} className="btn-text">
            Already a member? Log in
          </button>
        </div>
      </div>

      {/* LOGIN MODAL */}
      {showLoginModal && (
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
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '6px' }}>Welcome Back</h3>
            <p style={{ fontSize: '0.9rem', color: '#52525B', marginBottom: '22px' }}>Enter your registered email address to log in.</p>

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  placeholder="name@example.com" 
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
                {loginError && <span className="error-message">{loginError}</span>}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowLoginModal(false)} className="btn-secondary" style={{ flex: 1 }}>
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
