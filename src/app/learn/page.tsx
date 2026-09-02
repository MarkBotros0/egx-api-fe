import type { Metadata } from "next";
import LearnClient from "./LearnClient";

export const metadata: Metadata = {
  title: "Learn — EGX Analytics",
  description:
    "A guided path through everything EGX Analytics shows you: charts, indicators, the composite score, risk, and the Egyptian context — with diagrams and worked examples in EGP.",
};

export default function LearnPage() {
  return <LearnClient />;
}
