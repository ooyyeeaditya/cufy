import React from 'react';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound({ onReturnHome }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center',
      minHeight: '400px'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        background: '#FFF0F0',
        color: '#FF3B30',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <Compass size={32} />
      </div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Page Not Found</h2>
      <p style={{ color: '#52525B', fontSize: '0.98rem', maxWidth: '300px', marginBottom: '28px' }}>
        The page or match route you are trying to view does not exist or has been relocated.
      </p>
      <button onClick={onReturnHome} className="btn-primary" style={{ width: 'auto', padding: '12px 24px' }}>
        <ArrowLeft size={18} />
        Return to Safety
      </button>
    </div>
  );
}
