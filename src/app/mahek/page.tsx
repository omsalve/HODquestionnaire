import type { Metadata } from "next";
import { FOUNDER_NAMES } from "@/config/founders";
import { QUESTIONS } from "@/config/questions";
import { Questionnaire } from "@/components/Questionnaire";

export const metadata: Metadata = { title: `${FOUNDER_NAMES.mahek} · Discovery Questionnaire · House of Design` };

export default function MahekPage() {
  return <Questionnaire questions={QUESTIONS} founder="mahek" />;
}
