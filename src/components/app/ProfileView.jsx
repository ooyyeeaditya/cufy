import React, { useState, useRef } from 'react';
import { ArrowLeft, Heart, MessageSquare, MapPin, Home, Compass, Award, GraduationCap, Briefcase, Wine, Cigarette, Mic, Play, Pause } from 'lucide-react';

export default function ProfileView({ profile, onBack, onOpenChat, onLikeProfile }) {
  const [liked, setLiked] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const audioRef = useRef(null);

  if (!profile) return null;

  const handleToggleLike = () => {
    if (!liked) {
      setLiked(true);
      if (onLikeProfile) {
        onLikeProfile(profile);
      }
    } else {
      setLiked(false);
    }
  };

  const handleToggleVoice = (audioUrl) => {
    if (!audioUrl) return;
    if (isPlayingVoice) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingVoice(false);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingVoice(false);
      audio.onerror = (err) => {
        console.warn('Audio play error:', err);
        setIsPlayingVoice(false);
      };
      audio.play()
        .then(() => setIsPlayingVoice(true))
        .catch((err) => {
          console.warn('Audio play failed:', err);
          setIsPlayingVoice(false);
        });
    }
  };

  const photos = (profile.photos && Array.isArray(profile.photos) && profile.photos.length > 0)
    ? profile.photos.filter(Boolean)
    : (profile.photo ? [profile.photo] : ['/photos/front1.jpg']);

  const voiceUrl = profile.voiceNote?.audioUrl || profile.voiceNoteUrl || profile.voice_note_url;

  return (
    <div style={{ padding: '12px 16px 90px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ padding: '8px 14px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E4E4E7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800 }} aria-label="Back to feed">
          <ArrowLeft size={18} /> Back
        </button>
        <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#09090B' }}>
          Profile Details
        </span>
        <div style={{ width: '60px' }}></div>
      </div>

      {/* Main Full Photo Card */}
      <div style={{
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        height: '420px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.08)'
      }}>
        <img 
          src={photos[0]} 
          alt={profile.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '24px 20px 20px',
          background: 'linear-gradient(to top, rgba(9, 9, 11, 0.88) 0%, transparent 100%)',
          color: '#FFFFFF'
        }}>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 900, lineHeight: 1.1 }}>
            {profile.name}, {profile.age}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', marginTop: '6px', opacity: 0.95, fontWeight: 700 }}>
            <MapPin size={16} />
            {profile.city || profile.location || 'Greater Noida'}
          </div>
        </div>
      </div>

      {/* VOICE INTRO PLAYER */}
      {voiceUrl && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '16px 20px',
          border: '1.5px solid #E4E4E7',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
        }}>
          <button 
            type="button"
            onClick={() => handleToggleVoice(voiceUrl)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#FF3B30',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {isPlayingVoice ? <Pause size={20} fill="#FFFFFF" /> : <Play size={20} fill="#FFFFFF" style={{ marginLeft: '2px' }} />}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#FF3B30', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mic size={14} /> Voice Intro
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#09090B', marginTop: '2px' }}>
              "{profile.voiceNote?.prompt || 'Listen to audio intro'}"
            </div>
          </div>
        </div>
      )}

      {/* ABOUT / BIO SECTION */}
      {profile.bio && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '20px',
          border: '1.5px solid #E4E4E7',
          boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
            About Me
          </h3>
          <p style={{ fontSize: '1.02rem', color: '#09090B', lineHeight: '1.5', fontWeight: 700, margin: 0 }}>
            {profile.bio}
          </p>
        </div>
      )}

      {/* PROMPT 1 */}
      {(profile.prompt1Answer || profile.promptAnswer) && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '20px',
          border: '1.5px solid #E4E4E7',
          boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FF3B30', textTransform: 'uppercase', marginBottom: '6px' }}>
            {profile.prompt1 || profile.promptQuestion || 'Together, we could...'}
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#09090B', lineHeight: '1.35' }}>
            "{profile.prompt1Answer || profile.promptAnswer}"
          </div>
        </div>
      )}

      {/* PHOTO 2 */}
      {photos[1] && (
        <div style={{
          height: '380px',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          border: '1.5px solid #E4E4E7'
        }}>
          <img src={photos[1]} alt={`${profile.name} photo 2`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* PROMPT 2 */}
      {profile.prompt2Answer && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '20px',
          border: '1.5px solid #E4E4E7',
          boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FF3B30', textTransform: 'uppercase', marginBottom: '6px' }}>
            {profile.prompt2 || 'I get along best with people who...'}
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#09090B', lineHeight: '1.35' }}>
            "{profile.prompt2Answer}"
          </div>
        </div>
      )}

      {/* METADATA DETAILS */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '20px',
        border: '1.5px solid #E4E4E7',
        boxShadow: '0 4px 14px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Home size={18} style={{ color: '#09090B' }} />
          <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#09090B' }}>
            Lives in {profile.city || profile.location || 'Greater Noida'}
          </span>
        </div>

        {profile.hometown && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MapPin size={18} style={{ color: '#09090B' }} />
            <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#09090B' }}>
              From {profile.hometown}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Compass size={18} style={{ color: '#09090B' }} />
          <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#09090B' }}>
            {profile.distance || '4 km away'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Award size={18} style={{ color: '#09090B' }} />
          <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#09090B' }}>
            {profile.religion || profile.zodiac || 'Spiritual'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 900, width: '18px', textAlign: 'center' }}>📏</span>
          <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#09090B' }}>
            {profile.height || "5'8\""}
          </span>
        </div>

        {profile.education && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <GraduationCap size={18} style={{ color: '#09090B' }} />
            <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#09090B' }}>
              {profile.education}
            </span>
          </div>
        )}

        {profile.jobTitle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Briefcase size={18} style={{ color: '#09090B' }} />
            <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#09090B' }}>
              {profile.jobTitle}
            </span>
          </div>
        )}

        {profile.drinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wine size={18} style={{ color: '#09090B' }} />
            <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#09090B' }}>
              Drinks: {profile.drinking}
            </span>
          </div>
        )}

        {profile.smoking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Cigarette size={18} style={{ color: '#09090B' }} />
            <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#09090B' }}>
              Smoking: {profile.smoking}
            </span>
          </div>
        )}
      </div>

      {/* OTHER PHOTOS (3, 4, 5, 6) */}
      {photos.slice(2).map((photoUrl, pIdx) => (
        <div key={pIdx} style={{
          height: '380px',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          border: '1.5px solid #E4E4E7'
        }}>
          <img src={photoUrl} alt={`${profile.name} photo ${pIdx + 3}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}

      {/* Floating Interactive Controls */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button 
          onClick={handleToggleLike} 
          className="btn-secondary"
          style={{ flex: 1, borderColor: liked ? '#FF3B30' : '#E4E4E7', color: liked ? '#FF3B30' : '#09090B', padding: '14px', borderRadius: '16px' }}
        >
          <Heart size={20} fill={liked ? '#FF3B30' : 'none'} color={liked ? '#FF3B30' : '#09090B'} />
          {liked ? 'Liked' : 'Like'}
        </button>

        <button 
          onClick={() => onOpenChat(profile)} 
          className="btn-primary"
          style={{ flex: 1, padding: '14px', borderRadius: '16px' }}
        >
          <MessageSquare size={18} />
          Message
        </button>
      </div>

    </div>
  );
}

