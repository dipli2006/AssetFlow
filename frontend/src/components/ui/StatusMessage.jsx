import styles from "./StatusMessage.module.css";

export default function StatusMessage({ type = "info", children }) {
  return <div className={`${styles.base} ${styles[type]}`}>{children}</div>;
}
