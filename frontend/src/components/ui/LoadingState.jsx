import styles from "./LoadingState.module.css";

export default function LoadingState({ message = "Loading…" }) {
  return (
    <div className={styles.state} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
