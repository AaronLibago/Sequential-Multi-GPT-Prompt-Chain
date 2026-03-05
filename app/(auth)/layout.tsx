import styles from './auth.module.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Sequential Multi-GPT</h1>
          <p className={styles.authSubtitle}>5-stage AI expert chain</p>
        </div>
        {children}
      </div>
    </div>
  );
}
