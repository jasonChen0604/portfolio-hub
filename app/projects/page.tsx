import type { Metadata } from "next";
import { ProjectsClient } from "@/components/projects/ProjectsClient";
import { getAllProjects } from "@/lib/data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "124 projects spanning Frontend, Backend, AI/LLM, DevOps, Mobile, and more.",
};

export default function ProjectsPage() {
  const projectsEn = getAllProjects("en");
  const projectsZh = getAllProjects("zh");
  return <ProjectsClient projectsEn={projectsEn} projectsZh={projectsZh} />;
}
