// Reusable logout confirmation modal
export default function LogoutConfirmModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 380, border: '1px solid rgba(255,180,171,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,180,171,0.12)', border: '1px solid rgba(255,180,171,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#ffb4ab', fontVariationSettings: "'FILL' 1" }}>logout</span>
        </div>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#dae2fd', marginBottom: 8 }}>Sign Out?</h3>
        <p style={{ fontSize: '0.875rem', color: '#c7c4d8', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          Are you sure you want to sign out? You'll need to log in again to access your dashboard.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '0.75rem', background: '#222a3d', color: '#c7c4d8', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,180,171,0.15)', color: '#ffb4ab', border: '1px solid rgba(255,180,171,0.3)', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
