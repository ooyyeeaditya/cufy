import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Heart, X, Sparkles } from 'lucide-react';
import { getProfilesForUser, EXPLORE_PROFILES } from '../../data/mockProfiles';
import { fetchAllCloudUsers } from '../../lib/cloudSync';

export default function ExploreFeed({ onSelectProfile, userProfile }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState(['active lifestyle', 'serious relationship', 'pet lover']);
  const [likedMap, setLikedMap] = useState({});
  const [exploreProfiles, setExploreProfiles] = useState(() => getProfilesForUser(userProfile));

  useEffect(() => {
    async function loadProfiles() {
      try {
        const cloudUsers = await fetchAllCloudUsers();
        setExploreProfiles(getProfilesForUser(userProfile, cloudUsers));
      } catch (e) {
        setExploreProfiles(getProfilesForUser(userProfile));
      }
    }
    loadProfiles();
  }, [userProfile?.gender, userProfile?.interested_in, userProfile?.email]);

  const removeFilter = (tag) => {
    setActiveFilters(activeFilters.filter(t => t !== tag));
  };

  const toggleLike = (id, e) => {
    e.stopPropagation();
    setLikedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProfiles = exploreProfiles.filter(p => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.tag && p.tag.toLowerCase().includes(q)) ||
      (p.bio && p.bio.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ padding: '16px 16px 90px' }} className="animate-fade-in">
      
      {/* Explore Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#09090B', letterSpacing: '-0.8px' }}>
          Explore
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.85)',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: 800,
          color: '#FF3B30',
          border: '1px solid #E4E4E7'
        }}>
          <Sparkles size={14} />
          {filteredProfiles.length} Matches
        </div>
      </div>

      {/* Glass Search Input */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '16px', color: '#71717A' }} />
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter what you are interested in..."
          className="form-input"
          style={{ paddingLeft: '48px', paddingRight: '48px', borderRadius: '18px', background: '#FFFFFF' }}
        />
        {searchTerm ? (
          <button 
            onClick={() => setSearchTerm('')}
            style={{ position: 'absolute', right: '14px', top: '14px', color: '#71717A' }}
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        ) : (
          <button 
            style={{
              position: 'absolute',
              right: '12px',
              top: '10px',
              padding: '6px 10px',
              borderRadius: '12px',
              background: '#F4F4F5',
              color: '#27272A'
            }}
            aria-label="Filter options"
          >
            <SlidersHorizontal size={16} />
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        {activeFilters.map(filter => (
          <div 
            key={filter}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#FFFFFF',
              border: '1.5px solid #E4E4E7',
              borderRadius: '14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#27272A',
              boxShadow: 'var(--shadow-subtle)'
            }}
          >
            <span>{filter}</span>
            <button onClick={() => removeFilter(filter)} style={{ color: '#A1A1AA', display: 'flex' }} aria-label={`Remove filter ${filter}`}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Card Grid */}
      <div className="explore-grid" style={{ padding: 0 }}>
        {filteredProfiles.map(profile => {
          const isLiked = likedMap[profile.id];
          return (
            <div 
              key={profile.id}
              onClick={() => onSelectProfile(profile)}
              className="match-card"
            >
              <img 
                src={profile.photos[0]} 
                alt={profile.name} 
                className="match-card-img"
                loading="lazy"
              />

              <button 
                onClick={(e) => toggleLike(profile.id, e)} 
                className="heart-badge-btn"
                aria-label={`Like ${profile.name}`}
              >
                <Heart size={18} fill={isLiked ? '#FF3B30' : 'none'} color="#FF3B30" />
              </button>

              <div className="match-card-overlay">
                <span className="match-card-tag">{profile.tag}</span>
                <span className="match-card-name">{profile.name}, {profile.age}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
