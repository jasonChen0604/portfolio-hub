export type ProficiencyLevel = "expert" | "proficient" | "familiar";
export type ProjectStatus = "Production" | "Completed" | "In Progress" | "Archived";
export type Lang = "en" | "zh";

export interface Skill {
  tag: string;
  level: ProficiencyLevel;
  project_count: number;
  projects: string[];
}

export interface Domain {
  id: string;
  label: string;
  icon: string;
  project_count: number;
  summary: string;
  skills: Skill[];
}

export interface Project {
  id: string;
  name: string;
  category: string;
  status: ProjectStatus;
  status_badge: string;
  featured: boolean;
  tags: string[];
  core_tech: string;
  database: string;
  deployment: string;
  description: string;
  domain_primary: string;
  domains: string[];
}

export interface ProductProject {
  id: string;
  role: string;
  status: string;
}

export interface ProductGroup {
  product_name: string;
  project_count: number;
  roles: string[];
  status: ProjectStatus;
  projects: ProductProject[];
}

export interface ProfileMeta {
  meta: {
    generated_at: string;
    source_version: string;
    total_projects: number;
    lang: string;
    schema_version: string;
  };
  profile: {
    name: string;
    title: string;
    title_alt: string;
    email: string;
    summary: string;
    linkedin_about: string;
    years_of_experience: number;
    total_projects: number;
  };
  linkedin: {
    headline: string;
    about: string;
    skills_list: string[];
    experience_highlights: string[];
  };
  id_map: Record<string, string>;
}
