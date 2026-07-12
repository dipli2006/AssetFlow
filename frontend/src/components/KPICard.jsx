import styles from "./KPICard.module.css";

export default function KPICard({ title, value, icon, color, description }) {
  return (
    <article className={styles.card} style={{ "--card-color": color }}>
      <div className={styles.iconWrap} aria-hidden="true">
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <h3 className={styles.value}>{value}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </div>
    </article>
  );
}
