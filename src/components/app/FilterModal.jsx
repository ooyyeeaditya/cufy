import React, { useState } from 'react';
import { ChevronLeft, Lock, Sliders, Check, ShieldCheck } from 'lucide-react';

export default function FilterModal({ isOpen, onClose, onApplyFilters }) {
  const [relationship, setRelationship] = useState('All');
  const [ethnicity, setEthnicity] = useState('All');
  const [education, setEducation] = useState('All');
  const [religion, setReligion] = useState('All');
  const [drinking, setDrinking] = useState('All');
  const [smoking, setSmoking] = useState('All');
  const [distance, setDistance] = useState(30);
  const [minAge, setMinAge] = useState(20);
  const [maxAge, setMaxAge] = useState(32);
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  if (!isOpen) return null;

  const relationshipOptions = [
    'All',
    'Serious relationship',
    'Life partner',
    'Long-term relationship',
    'Casual dating',
    'Friendship'
  ];

  const ethnicityOptions = [
    'All',
    'South Asian',
    'East Asian',
    'White',
    'Black',
    'Hispanic',
    'Middle Eastern',
    'Mixed'
  ];

  const educationOptions = [
    'All',
    'College',
    'Bachelor',
    'Master',
    'Doctorate / Ph.D.'
  ];

  const religionOptions = [
    'All',
    'Atheist',
    'Agnostic',
    'Hindu',
    'Christian',
    'Muslim',
    'Spiritual',
    'Sikh'
  ];

  const habitOptions = ['All', 'Never', 'Socially', 'Regularly'];

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
      
      {/* Top Bar with Back Arrow */}
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
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#09090B' }}>
          Preferences & Filters
        </h2>

        <button 
          onClick={() => {
            if (onApplyFilters) onApplyFilters({ relationship, ethnicity, education, religion, drinking, smoking, distance, minAge, maxAge, verifiedOnly });
            onClose();
          }}
          style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FF3B30' }}
        >
          Save
        </button>
      </div>

      {/* Main Filter Content List matching Onboarding Questions */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 100px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* SECTION 1: Relationship Goal */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B', letterSpacing: '-0.3px' }}>
              Relationship Goal
            </h3>
            <Lock size={16} style={{ color: '#71717A' }} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {relationshipOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setRelationship(opt)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '16px',
                  background: relationship === opt ? '#FF3B30' : '#EBE8E1',
                  color: relationship === opt ? '#FFFFFF' : '#09090B',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  transition: 'all 0.2s var(--ease-spring)',
                  border: 'none'
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 2: Maximum Distance Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
              Maximum Distance
            </h3>
            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#FF3B30' }}>{distance} km</span>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '16px 20px',
            border: '1.5px solid #E4E4E7'
          }}>
            <input 
              type="range"
              min="5"
              max="100"
              value={distance}
              onChange={(e) => setDistance(parseInt(e.target.value))}
              className="height-range-slider"
              style={{ width: '100%', accentColor: '#FF3B30' }}
            />
          </div>
        </div>

        {/* SECTION 3: Age Range */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
              Age Range
            </h3>
            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#FF3B30' }}>{minAge} - {maxAge} years</span>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '16px 20px',
            border: '1.5px solid #E4E4E7',
            display: 'flex',
            gap: '12px'
          }}>
            <input 
              type="range" 
              min="18" 
              max="35" 
              value={minAge} 
              onChange={(e) => setMinAge(parseInt(e.target.value))}
              className="height-range-slider"
              style={{ flex: 1, accentColor: '#FF3B30' }}
            />
            <input 
              type="range" 
              min="22" 
              max="50" 
              value={maxAge} 
              onChange={(e) => setMaxAge(parseInt(e.target.value))}
              className="height-range-slider"
              style={{ flex: 1, accentColor: '#FF3B30' }}
            />
          </div>
        </div>

        {/* SECTION 4: Ethnicity */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
              Ethnicity
            </h3>
            <Lock size={16} style={{ color: '#71717A' }} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {ethnicityOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setEthnicity(opt)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '16px',
                  background: ethnicity === opt ? '#FF3B30' : '#EBE8E1',
                  color: ethnicity === opt ? '#FFFFFF' : '#09090B',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  border: 'none'
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 5: Education Level */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
              Education Level
            </h3>
            <Lock size={16} style={{ color: '#71717A' }} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {educationOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setEducation(opt)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '16px',
                  background: education === opt ? '#FF3B30' : '#EBE8E1',
                  color: education === opt ? '#FFFFFF' : '#09090B',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  border: 'none'
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 6: Religion */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
              Religious Beliefs
            </h3>
            <Lock size={16} style={{ color: '#71717A' }} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {religionOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setReligion(opt)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '16px',
                  background: religion === opt ? '#FF3B30' : '#EBE8E1',
                  color: religion === opt ? '#FFFFFF' : '#09090B',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  border: 'none'
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 7: Lifestyle - Drinking */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
              Drinking Habits
            </h3>
            <Lock size={16} style={{ color: '#71717A' }} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {habitOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setDrinking(opt)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '16px',
                  background: drinking === opt ? '#FF3B30' : '#EBE8E1',
                  color: drinking === opt ? '#FFFFFF' : '#09090B',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  border: 'none'
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 8: Lifestyle - Smoking */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
              Smoking Habits
            </h3>
            <Lock size={16} style={{ color: '#71717A' }} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {habitOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setSmoking(opt)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '16px',
                  background: smoking === opt ? '#FF3B30' : '#EBE8E1',
                  color: smoking === opt ? '#FFFFFF' : '#09090B',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  border: 'none'
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 9: Verified Profiles Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1.5px solid #E4E4E7'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 800, color: '#09090B' }}>
            <ShieldCheck size={20} style={{ color: '#10B981' }} />
            <span>Verified Members Only</span>
          </div>
          <input 
            type="checkbox" 
            checked={verifiedOnly} 
            onChange={(e) => setVerifiedOnly(e.target.checked)} 
            style={{ width: '22px', height: '22px', accentColor: '#FF3B30', cursor: 'pointer' }}
          />
        </div>

        {/* Bottom Apply Action Pill */}
        <button 
          onClick={() => {
            if (onApplyFilters) onApplyFilters({ relationship, ethnicity, education, religion, drinking, smoking, distance, minAge, maxAge, verifiedOnly });
            onClose();
          }}
          className="btn-black-pill"
          style={{ width: '100%', marginTop: '10px' }}
        >
          Save Preferences
        </button>

      </div>
    </div>
  );
}
