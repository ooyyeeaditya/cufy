import React from 'react';
import { Smartphone, Monitor, ShieldCheck, FileText } from 'lucide-react';

export default function DeviceFrameToggle({ isFullWidth, onToggleWidth, onOpenPrivacy, onOpenTerms, onOpenAdmin }) {
  return (
    <div className="global-topbar">
      <div className="brand-badge" style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src="/photos/cufylogo.jpg" 
          alt="cufy logo" 
          style={{ height: '24px', borderRadius: '6px', objectFit: 'contain' }} 
        />
      </div>

      <div className="topbar-actions">
        <button onClick={onOpenPrivacy} className="btn-topbar-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={14} />
          Privacy
        </button>

        <button onClick={onOpenTerms} className="btn-topbar-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FileText size={14} />
          Terms
        </button>

        <button 
          onClick={onToggleWidth} 
          style={{
            padding: '6px 12px',
            background: '#F4F4F5',
            borderRadius: '10px',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#27272A'
          }}
          title={isFullWidth ? "Switch to Phone Frame View" : "Expand to Desktop View"}
        >
          {isFullWidth ? <Smartphone size={15} /> : <Monitor size={15} />}
          {isFullWidth ? "Phone Frame" : "Desktop View"}
        </button>
      </div>
    </div>
  );
}
