export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '4rem 1rem',
      color: 'var(--color-text-muted)',
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
        marginRight: '0.75rem',
      }} />
      Loading...
    </div>
  );
}
