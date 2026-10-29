import type { Metadata } from "next";
import { FOUNDER_NAMES } from "@/config/founders";
import { QUESTIONS } from "@/config/questions";
import { Questionnaire } from "@/components/Questionnaire";

export const metadata: Metadata = { title: `${FOUNDER_NAMES.dhanshree} · Discovery Questionnaire · House of Design` };

export default function DhanshreePage() {
  return <Questionnaire questions={QUESTIONS} founder="dhanshree" />;
}
