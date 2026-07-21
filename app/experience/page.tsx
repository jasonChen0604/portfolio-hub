import type { Metadata } from "next";
import { ExperienceClient } from "@/components/experience/ExperienceClient";
import { resumeData } from "@/lib/data/loaders";

export const metadata: Metadata = {
	title: "Experience",
	description: "Jason Chen's work experience, education, and certifications.",
};

export default function ExperiencePage() {
	return <ExperienceClient resumeEn={resumeData.en} resumeZh={resumeData.zh} />;
}
