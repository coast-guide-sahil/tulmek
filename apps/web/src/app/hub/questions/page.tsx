import type { Metadata } from "next";
import type { InterviewQuestion } from "@tulmek/core/domain";
import { APP_NAME } from "@tulmek/config/constants";
import { QuestionsView } from "@/components/questions/questions-view";
import questionsData from "@tulmek/content/hub/questions";

export const metadata: Metadata = {
  title: "Interview Questions",
  description: `AI-extracted interview questions from real experiences. Searchable by company, difficulty, and topic. ${APP_NAME}.`,
  alternates: { canonical: "/hub/questions" },
};

export const dynamic = "force-static";

const questions = questionsData as unknown as InterviewQuestion[];

export default function QuestionsPage() {
  return <QuestionsView questions={questions} />;
}
