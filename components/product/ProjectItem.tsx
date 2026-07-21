"use client";

import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Chip from "@mui/joy/Chip";
import Typography from "@mui/joy/Typography";
import type { ProductProject, Project } from "@/lib/data/types";

const statusColor = {
	Production: "success",
	"In Progress": "warning",
	Completed: "neutral",
	Archived: "neutral",
} as const;

export function ProjectItem({
	project,
	productProject,
}: {
	project: Project;
	productProject: ProductProject;
}) {
	return (
		<Card id={project.id} variant="soft" sx={{ scrollMarginTop: "80px" }}>
			<CardContent>
				<Box
					sx={{
						display: "flex",
						flexWrap: "wrap",
						gap: 1,
						mb: 1.5,
						alignItems: "center",
					}}
				>
					<Typography level="title-md">{project.name}</Typography>
					<Chip
						size="sm"
						variant="outlined"
						color="neutral"
						sx={{ ml: "auto" }}
					>
						{productProject.role}
					</Chip>
					<Chip
						size="sm"
						variant="soft"
						color={statusColor[project.status] ?? "neutral"}
					>
						{project.status}
					</Chip>
				</Box>
				<Typography level="body-sm" color="neutral" sx={{ mb: 2 }}>
					{project.description}
				</Typography>
				<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
					{project.tags.map((tag) => (
						<Chip key={tag} size="sm" variant="outlined" color="neutral">
							{tag}
						</Chip>
					))}
				</Box>
				{(project.core_tech || project.database || project.deployment) && (
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
						{project.core_tech && (
							<Typography level="body-xs" color="neutral">
								Core: {project.core_tech}
							</Typography>
						)}
						{project.database && (
							<Typography level="body-xs" color="neutral">
								DB: {project.database}
							</Typography>
						)}
						{project.deployment && (
							<Typography level="body-xs" color="neutral">
								Deploy: {project.deployment}
							</Typography>
						)}
					</Box>
				)}
			</CardContent>
		</Card>
	);
}
