import { ReviewResult } from "../types";
import styles from "./ReviewReport.module.css";

function Score({ label, value = 0 }: { label: string; value?: number }) {
  return <div className={styles.score}><div><span>{label}</span><span className={styles.scoreVal}>{value}/100</span></div><span className={styles.scoreTrack}><span style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} /></span></div>;
}

export default function ReviewReport({ result }: { result: ReviewResult }) {
  return <div className={styles.report}>
    <aside className={styles.side}><div className={styles.overall}><span>Overall score</span><strong>{result.overallScore ?? 0}</strong><small>/100</small></div><Score label="Readability" value={result.readability} /><Score label="Performance" value={result.performance} /><Score label="Security" value={result.security} /><Score label="Maintainability" value={result.maintainability} /><div className={styles.complexity}><div><span>Time complexity</span><strong>{result.timeComplexity || "Not determined"}</strong></div><div><span>Space complexity</span><strong>{result.spaceComplexity || "Not determined"}</strong></div></div></aside>
    <div className={styles.content}>
      <section className={styles.section}><h2>Review summary</h2><p className={styles.summary}>{result.summary || "No summary was returned."}</p></section>
      <section className={styles.section}><h2>Issues ({result.issues?.length || 0})</h2>{result.issues?.length ? <div className={styles.issues}>{result.issues.map((issue, index) => <article className={`${styles.issue} ${styles[issue.severity]}`} key={`${issue.title}-${index}`}><div className={styles.issueTop}><span>{issue.severity}{issue.category ? ` · ${issue.category}` : ""}</span>{issue.line && <small>Line {issue.line}</small>}</div><h3>{issue.title}</h3>{issue.description && <p>{issue.description}</p>}{issue.suggestion && <aside><b>Suggested fix</b>{issue.suggestion}</aside>}</article>)}</div> : <p className={styles.empty}>No issues were identified.</p>}</section>
      <section className={styles.section}><h2>Refactoring suggestions ({result.refactoring?.length || 0})</h2>{result.refactoring?.length ? <div className={styles.refactors}>{result.refactoring.map((item, index) => <article className={styles.refactor} key={index}><div className={styles.compare}><div><span>Before</span><pre>{item.before}</pre></div><div><span>After</span><pre>{item.after}</pre></div></div>{item.explanation && <p>{item.explanation}</p>}</article>)}</div> : <p className={styles.empty}>No refactoring examples were returned.</p>}</section>
    </div>
  </div>;
}
