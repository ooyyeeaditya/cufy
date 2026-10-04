import React, { useState } from 'react';
import { ArrowLeft, Heart, MessageSquare, Video, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

export default function ProfileView({ profile, onBack, onOpenChat }) {
  const [liked, setLiked] = useState(false);

  if (!profile) return null;

  return (
    <div style={{ padding: '12px 16px 90px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ padding: '8px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E4E4E7' }} aria-label="Back to feed">
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#09090B' }}>
          Profile Details
        </span>
        <div style={{ width: '34px' }}></div>
      </div>

      {/* Main Full Photo Card */}
      <div style={{
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        height: '380px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.08)'
      }}>
        <img 
          src={profile.photos[0]} 
          alt={profile.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />

        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          display: 'flex',
          gap: '6px'
        }}>
          {profile.tags && profile.tags.slice(0, 2).map((t, idx) => (
            <span key={idx} style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '4px 10px',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
              color: '#09090B'
            }}>
              {t}
            </span>
          ))}
        </div>

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 16px 16px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
          color: '#FFFFFF'
        }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.1 }}>
            {profile.name}, {profile.age}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', marginTop: '4px', opacity: 0.9 }}>
            <MapPin size={14} />
            {profile.city || 'New York, NY'}
          </div>
        </div>
      </div>

      {/* About Section Matching Reference Template */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid #F4F4F5'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: '#09090B' }}>
          About
        </h3>
        <p style={{ fontSize: '0.94rem', color: '#52525B', lineHeight: '1.55', marginBottom: '16px' }}>
          {profile.bio || "This dating app is designed to help people find meaningful connections through a safe, smart, and intentional experience."}
        </p>

        {profile.promptQuestion && (
          <div style={{
            background: '#FAF8F5',
            padding: '14px',
            borderRadius: '14px',
            border: '1px solid #E4E4E7'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {profile.promptQuestion}
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#09090B', marginTop: '4px' }}>
              {profile.promptAnswer}
            </div>
          </div>
        )}
      </div>

      {/* Floating Interactive Controls */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => setLiked(!liked)} 
          className="btn-secondary"
          style={{ flex: 1, borderColor: liked ? '#FF3B30' : '#E4E4E7', color: liked ? '#FF3B30' : '#09090B' }}
        >
          <Heart size={20} fill={liked ? '#FF3B30' : 'none'} color={liked ? '#FF3B30' : '#09090B'} />
          {liked ? 'Liked' : 'Like'}
        </button>

        <button 
          onClick={() => onOpenChat(profile)} 
          className="btn-primary"
          style={{ flex: 1 }}
        >
          <MessageSquare size={18} />
          Message
        </button>
      </div>

    </div>
  );
}
