import type { Domain } from "@/lib/data/types";
import {
  domainVisualConfigs,
  categoryConfigs,
  languageSkills,
} from "./hierarchyConfig";

export type NodeType = "domain" | "category" | "skill";

export interface GraphNode {
  id: string;
  label: string;
  nodeType: NodeType;
  domainId: string;
  color: string;
  size: number;
  // only on skill nodes
  skillTag?: string;
  skillLevel?: string;
  projectIds?: string[];
  projectCount?: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Build a flat map: tag (lowercase) → Skill from raw domain data
function buildSkillMap(domains: Domain[]) {
  const map = new Map<string, { level: string; projects: string[]; project_count: number }>();
  for (const domain of domains) {
    for (const skill of domain.skills) {
      map.set(skill.tag.toLowerCase(), {
        level: skill.level,
        projects: skill.projects ?? [],
        project_count: skill.project_count,
      });
    }
  }
  return map;
}

export function buildGraphData(domains: Domain[], lang: "en" | "zh" = "en"): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const skillMap = buildSkillMap(domains);

  for (const domainCfg of domainVisualConfigs) {
    const domainNodeId = `domain:${domainCfg.domainId}`;
    nodes.push({
      id: domainNodeId,
      label: lang === "zh" ? domainCfg.labelZh : domainCfg.label,
      nodeType: "domain",
      domainId: domainCfg.domainId,
      color: domainCfg.color,
      size: domainCfg.domainNodeSize,
    });

    // Languages: flat domain → skill (no categories)
    if (domainCfg.domainId === "languages") {
      for (const tag of languageSkills) {
        const skillData = skillMap.get(tag.toLowerCase());
        const skillNodeId = `skill:${tag}`;
        nodes.push({
          id: skillNodeId,
          label: tag,
          nodeType: "skill",
          domainId: domainCfg.domainId,
          color: domainCfg.color,
          size: domainCfg.leafNodeSize,
          skillTag: tag,
          skillLevel: skillData?.level,
          projectIds: skillData?.projects ?? [],
          projectCount: skillData?.project_count ?? 0,
        });
        links.push({ source: domainNodeId, target: skillNodeId });
      }
      continue;
    }

    // All other domains: domain → category → skill
    const domainCategories = categoryConfigs.filter((c) => c.domainId === domainCfg.domainId);
    for (const cat of domainCategories) {
      const catNodeId = `cat:${cat.id}`;
      nodes.push({
        id: catNodeId,
        label: lang === "zh" ? cat.labelZh : cat.label,
        nodeType: "category",
        domainId: domainCfg.domainId,
        color: domainCfg.color,
        size: domainCfg.categoryNodeSize,
      });
      links.push({ source: domainNodeId, target: catNodeId });

      for (const tag of cat.skills) {
        const skillData = skillMap.get(tag.toLowerCase());
        const skillNodeId = `skill:${tag}`;
        // avoid duplicate skill nodes (same tag in multiple categories)
        if (!nodes.find((n) => n.id === skillNodeId)) {
          nodes.push({
            id: skillNodeId,
            label: tag,
            nodeType: "skill",
            domainId: domainCfg.domainId,
            color: domainCfg.color,
            size: domainCfg.leafNodeSize,
            skillTag: tag,
            skillLevel: skillData?.level,
            projectIds: skillData?.projects ?? [],
            projectCount: skillData?.project_count ?? 0,
          });
        }
        links.push({ source: catNodeId, target: skillNodeId });
      }
    }
  }

  return { nodes, links };
}
