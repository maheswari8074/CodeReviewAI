"use client";

import AppShell from "../components/AppShell";
import ChatPanel from "../components/ChatPanel";
import { PageHeader } from "../components/UI";
import styles from "./chat.module.css";

export default function ChatPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="AI assistant"
        title="Work through a coding question"
        description="Ask for explanations, compare approaches, or discuss engineering best practices. Do not include credentials or private secrets."
      />
      <div className={styles.wrap}>
        <ChatPanel floating={false} title="CodeReviewAI assistant" />
      </div>
    </AppShell>
  );
}
