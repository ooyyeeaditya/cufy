import React, { useState } from 'react';
import { Heart, MessageSquare } from 'lucide-react';
import { HOME_SWIPE_PROFILES } from '../../data/mockProfiles';

export default function LikesFeed({ onSelectProfile, onOpenChat }) {
  const [activeTab, setActiveTab] = useState('likes_you'); // 'likes_you' | 'you_liked'

  const likesYouProfiles = HOME_SWIPE_PROFILES;
  const youLikedProfiles = HOME_SWIPE_PROFILES.slice(1);

  return (
    <div style={{
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#F5F3EF',
      overflow: 'hidden'
    }} className="animate-fade-in">
      
      {/* FIXED HAIKEI BACKGROUND GRAPHIC LAYER */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url('/photos/haikei2 (2).png')`,
        backgroundSize: 'cover',
        opacity: 0.14,
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      {/* INNER CONTENT CONTAINER */}
      <div style={{ flex: 1, padding: '16px 18px 85px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Minimal Compact Header */}
        <div style={{ marginBottom: '14px' }}>
          <h1 className="editorial-title" style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px' }}>
            Connections
          </h1>

          {/* Tab Selector: Likes You | You Liked */}
          <div style={{
            display: 'flex',
            background: '#E4E4E7',
            padding: '3px',
            borderRadius: '16px',
            gap: '4px'
          }}>
            <button 
              onClick={() => setActiveTab('likes_you')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '13px',
                background: activeTab === 'likes_you' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'likes_you' ? '#09090B' : '#71717A',
                fontWeight: 800,
                fontSize: '0.84rem',
                boxShadow: activeTab === 'likes_you' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s var(--ease-spring)'
              }}
            >
              Likes You ({likesYouProfiles.length})
            </button>

            <button 
              onClick={() => setActiveTab('you_liked')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '13px',
                background: activeTab === 'you_liked' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'you_liked' ? '#09090B' : '#71717A',
                fontWeight: 800,
                fontSize: '0.84rem',
                boxShadow: activeTab === 'you_liked' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s var(--ease-spring)'
              }}
            >
              You Liked ({youLikedProfiles.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {/* POPULATED STATE */}
          {activeTab === 'likes_you' && likesYouProfiles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {likesYouProfiles.map((profile) => (
                <div 
                  key={profile.id}
                  onClick={() => onSelectProfile(profile)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1.5px solid #E4E4E7',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ height: '160px', position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={profile.photos[0]} 
                      alt={profile.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#FF3B30',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Heart size={14} fill="#FFFFFF" />
                    </div>
                  </div>

                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#09090B' }}>
                      {profile.name}, {profile.age}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#71717A', fontWeight: 600, margin: '2px 0 8px' }}>
                      {profile.city}
                    </div>

                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat(profile);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#FF3B30',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>Match & Chat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'you_liked' && youLikedProfiles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {youLikedProfiles.map((profile) => (
                <div 
                  key={profile.id}
                  onClick={() => onSelectProfile(profile)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1.5px solid #E4E4E7',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ height: '160px', position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={profile.photos[0]} 
                      alt={profile.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#09090B' }}>
                      {profile.name}, {profile.age}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#71717A', fontWeight: 600, marginTop: '2px' }}>
                      {profile.city}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ULTRA CLEAN MINIMAL EMPTY STATE (Zero scroll needed!) */}
          {((activeTab === 'likes_you' && likesYouProfiles.length === 0) || (activeTab === 'you_liked' && youLikedProfiles.length === 0)) && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '10px'
            }}>
              
              {/* Compact Heart Icon Circle */}
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#FFF0F0',
                color: '#FF3B30',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 8px 24px rgba(255,59,48,0.15)'
              }}>
                <Heart size={36} fill="#FF3B30" />
              </div>

              {/* Concise Headline */}
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B', marginBottom: '4px', letterSpacing: '-0.3px' }}>
                Likes you receive will appear here
              </h2>

              <p style={{ fontSize: '0.84rem', color: '#71717A', fontWeight: 600, margin: 0 }}>
                When authentic members like your profile, you will see them here.
              </p>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
