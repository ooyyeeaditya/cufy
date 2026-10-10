import React, { useState } from 'react';
import { ChevronLeft, X, Lock, Camera, Trash2, Plus, Mic, Play, Pause, Check } from 'lucide-react';
import VoiceRecorderWidget from '../common/VoiceRecorderWidget';
import { fileToCompressedBase64 } from '../../utils/imageUpload';

export default function EditProfileModal({ isOpen, onClose, userProfile, onSave }) {
  if (!isOpen) return null;

  const [name, setName] = useState(userProfile?.name || '');
  const [gender] = useState(userProfile?.gender || 'Man'); // Read-only & locked!
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [promptQuestion, setPromptQuestion] = useState(userProfile?.promptQuestion || userProfile?.prompt1 || 'Ideal Sunday Morning');
  const [promptAnswer, setPromptAnswer] = useState(userProfile?.promptAnswer || userProfile?.prompt1Answer || '');
  const [height, setHeight] = useState(
    userProfile?.height || (userProfile?.heightFeet ? `${userProfile.heightFeet}'${userProfile.heightInches || 0}"` : '')
  );
  const [city, setCity] = useState(userProfile?.city || userProfile?.location || '');
  const [occupation, setOccupation] = useState(userProfile?.occupation || userProfile?.jobTitle || '');
  const [education, setEducation] = useState(userProfile?.education || userProfile?.college || userProfile?.degree || '');
  const [religion, setReligion] = useState(userProfile?.religion || '');

  const userPhotoList = Array.isArray(userProfile?.photos) 
    ? userProfile.photos.filter(Boolean) 
    : (userProfile?.photo ? [userProfile.photo] : []);

  const [photos, setPhotos] = useState([
    userPhotoList[0] || '',
    userPhotoList[1] || '',
    userPhotoList[2] || '',
    userPhotoList[3] || '',
    userPhotoList[4] || '',
    userPhotoList[5] || ''
  ]);

  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState('0:14');

  // Keep modal state updated with real userProfile data
  React.useEffect(() => {
    if (userProfile && isOpen) {
      setName(userProfile.name || '');
      setBio(userProfile.bio || '');
      setPromptQuestion(userProfile.promptQuestion || userProfile.prompt1 || 'Ideal Sunday Morning');
      setPromptAnswer(userProfile.promptAnswer || userProfile.prompt1Answer || '');
      setHeight(userProfile.height || (userProfile.heightFeet ? `${userProfile.heightFeet}'${userProfile.heightInches || 0}"` : ''));
      setCity(userProfile.city || userProfile.location || '');
      setOccupation(userProfile.occupation || userProfile.jobTitle || '');
      setEducation(userProfile.education || userProfile.college || userProfile.degree || '');
      setReligion(userProfile.religion || '');

      const pList = Array.isArray(userProfile.photos) 
        ? userProfile.photos.filter(Boolean) 
        : (userProfile.photo ? [userProfile.photo] : []);

      setPhotos([
        pList[0] || '',
        pList[1] || '',
        pList[2] || '',
        pList[3] || '',
        pList[4] || '',
        pList[5] || ''
      ]);
    }
  }, [userProfile, isOpen]);

  const handlePhotoUpload = async (index, event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const url = await fileToCompressedBase64(file, 640, 0.72);
        const newPhotos = [...photos];
        newPhotos[index] = url;
        setPhotos(newPhotos);
      } catch (err) {
        console.error('Failed to convert photo in edit profile:', err);
      }
    }
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos[index] = '';
    setPhotos(newPhotos);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    let hFeet = userProfile?.heightFeet || 5;
    let hInches = userProfile?.heightInches || 0;
    if (height && typeof height === 'string') {
      const match = height.match(/(\d+)\s*['ftfeet]*\s*(\d*)/i);
      if (match && match[1]) {
        hFeet = parseInt(match[1], 10);
        if (match[2]) hInches = parseInt(match[2], 10);
      }
    }
    const updatedData = {
      name,
      gender,
      bio,
      promptQuestion,
      promptAnswer,
      prompt1: promptQuestion,
      prompt1Answer: promptAnswer,
      height,
      heightFeet: hFeet,
      heightInches: hInches,
      city,
      location: city,
      occupation,
      jobTitle: occupation,
      education,
      college: education,
      religion,
      photos: photos.filter(p => !!p)
    };
    if (onSave) onSave(updatedData);
    onClose();
  };

  const promptOptions = [
    'Ideal Sunday Morning',
    'The key to my heart is',
    'A life rule I live by',
    'I get along best with people who',
    'My simple pleasures'
  ];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      background: '#F5F3EF',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }} className="animate-fade-in">
      
      {/* Top Header Navigation Bar */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(245, 243, 239, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E4E4E7',
        zIndex: 10
      }}>
        <button 
          onClick={onClose}
          style={{ padding: '8px', borderRadius: '12px', background: '#FFFFFF', color: '#09090B' }}
          aria-label="Close edit profile"
        >
          <ChevronLeft size={22} />
        </button>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
          Edit Profile
        </h2>

        <button 
          onClick={handleFormSubmit}
          style={{
            padding: '8px 18px',
            background: '#FF3B30',
            color: '#FFFFFF',
            borderRadius: '16px',
            fontSize: '0.9rem',
            fontWeight: 800,
            boxShadow: '0 4px 14px rgba(255, 59, 48, 0.3)'
          }}
        >
          Done
        </button>
      </div>

      {/* Main Scrollable Content Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 100px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* SECTION 1: PHOTOS GRID (6 Slots) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
              Profile Media (6 Slots)
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#71717A', fontWeight: 600 }}>Drag to reorder</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {photos.map((photo, idx) => (
              <div 
                key={idx}
                style={{
                  position: 'relative',
                  height: '140px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  background: photo ? '#09090B' : '#EBE8E1',
                  border: photo ? '1.5px solid #E4E4E7' : '2px dashed #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: photo ? '0 6px 18px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                {photo ? (
                  <>
                    <img src={photo} alt={`Upload ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    
                    {idx === 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: '#09090B',
                        color: '#FFFFFF',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: '8px',
                        textTransform: 'uppercase'
                      }}>
                        Main
                      </span>
                    )}

                    <button 
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'rgba(9, 9, 11, 0.7)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      aria-label="Remove photo"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#71717A' }}>
                    <Camera size={24} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Add</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handlePhotoUpload(idx, e)} 
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: FIRST NAME */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">First Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            style={{ borderRadius: '18px', background: '#FFFFFF' }}
          />
        </div>

        {/* SECTION 3: GENDER (READ ONLY & LOCKED WITH LOCK ICON!) */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Gender</label>
            <span style={{ fontSize: '0.78rem', color: '#71717A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={13} style={{ color: '#FF3B30' }} /> Locked & Verified
            </span>
          </div>
          <div style={{
            padding: '16px 18px',
            borderRadius: '18px',
            background: '#EBE8E1',
            border: '1.5px solid #E4E4E7',
            color: '#52525B',
            fontWeight: 800,
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{gender}</span>
            <Lock size={16} style={{ color: '#71717A' }} />
          </div>
          <p style={{ fontSize: '0.78rem', color: '#71717A', marginTop: '6px', fontWeight: 500 }}>
            Gender cannot be changed after initial account verification to maintain community safety.
          </p>
        </div>

        {/* SECTION 4: BIO & HINGE PROMPTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
            Bio & Prompts
          </h3>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">About Me (Bio)</label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="form-input"
              style={{ borderRadius: '18px', background: '#FFFFFF', lineHeight: '1.45' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hinge Prompt Question</label>
            <select 
              value={promptQuestion}
              onChange={(e) => setPromptQuestion(e.target.value)}
              className="form-input"
              style={{ borderRadius: '18px', background: '#FFFFFF', cursor: 'pointer' }}
            >
              {promptOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Prompt Answer</label>
            <textarea 
              value={promptAnswer} 
              onChange={(e) => setPromptAnswer(e.target.value)}
              rows={2}
              className="form-input"
              style={{ borderRadius: '18px', background: '#FFFFFF', lineHeight: '1.45' }}
            />
          </div>
        </div>

        {/* SECTION 5: VOICE INTRO NOTE RECORDING */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
            Voice Intro Note
          </h3>

          <VoiceRecorderWidget 
            initialAudioUrl={userProfile?.voiceNoteUrl}
            initialDuration={userProfile?.voiceDuration || '0:00'}
            onSave={({ audioUrl, duration }) => {
              setVoiceDuration(duration);
              if (onSave) {
                onSave({ voiceNoteUrl: audioUrl, voiceDuration: duration });
              }
            }}
          />
        </div>


        {/* SECTION 6: PERSONAL ATTRIBUTES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
            Personal Details
          </h3>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Height</label>
            <input 
              type="text" 
              value={height} 
              onChange={(e) => setHeight(e.target.value)}
              className="form-input"
              style={{ borderRadius: '18px', background: '#FFFFFF' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">City / Location</label>
            <input 
              type="text" 
              value={city} 
              onChange={(e) => setCity(e.target.value)}
              className="form-input"
              style={{ borderRadius: '18px', background: '#FFFFFF' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Job Title / Occupation</label>
            <input 
              type="text" 
              value={occupation} 
              onChange={(e) => setOccupation(e.target.value)}
              className="form-input"
              style={{ borderRadius: '18px', background: '#FFFFFF' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Education Level</label>
            <input 
              type="text" 
              value={education} 
              onChange={(e) => setEducation(e.target.value)}
              className="form-input"
              style={{ borderRadius: '18px', background: '#FFFFFF' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Religious Beliefs</label>
            <input 
              type="text" 
              value={religion} 
              onChange={(e) => setReligion(e.target.value)}
              className="form-input"
              style={{ borderRadius: '18px', background: '#FFFFFF' }}
            />
          </div>
        </div>

        {/* Bottom Save Pill CTA */}
        <button 
          onClick={handleFormSubmit}
          className="btn-black-pill"
          style={{ width: '100%', marginTop: '16px' }}
        >
          Save All Changes
        </button>

      </div>
    </div>
  );
}
