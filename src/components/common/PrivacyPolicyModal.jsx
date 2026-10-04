import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(9, 9, 11, 0.75)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backdropFilter: 'blur(6px)'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: '28px',
        boxShadow: '0 20px 48px rgba(0,0,0,0.2)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck style={{ color: '#FF3B30' }} size={24} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Privacy Policy</h2>
          </div>
          <button 
            onClick={onClose} 
            style={{ padding: '8px', background: '#F4F4F5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: '0.92rem', color: '#52525B', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '14px' }}>
            <strong>Effective Date:</strong> October 4, 2026
          </p>
          <p style={{ marginBottom: '14px' }}>
            At Cufy, your privacy is our foundational commitment. We believe in intentional connections built on trust, transparency, and data ownership.
          </p>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#09090B', marginTop: '16px', marginBottom: '8px' }}>
            1. Information We Collect
          </h3>
          <p style={{ marginBottom: '14px' }}>
            We only collect information necessary to deliver curated matches:
            account details (first name, birthdate, gender, location city), user preferences, uploaded photos, and short bio prompts.
          </p>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#09090B', marginTop: '16px', marginBottom: '8px' }}>
            2. Data Security & Protection
          </h3>
          <p style={{ marginBottom: '14px' }}>
            All transmissions are encrypted over TLS/HTTPS. Private photos and chat messages are encrypted at rest using industry-standard protocols.
          </p>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#09090B', marginTop: '16px', marginBottom: '8px' }}>
            3. Zero Data Sale Policy
          </h3>
          <p style={{ marginBottom: '14px' }}>
            Cufy does not sell, rent, or trade your personal profile data or messages to advertisers or data brokers under any circumstances.
          </p>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#09090B', marginTop: '16px', marginBottom: '8px' }}>
            4. Account Deletion
          </h3>
          <p style={{ marginBottom: '14px' }}>
            You retain total control over your profile. You may permanently erase your account and associated media directly from the profile settings tab at any time.
          </p>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E4E4E7' }}>
          <button onClick={onClose} className="btn-primary">
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
