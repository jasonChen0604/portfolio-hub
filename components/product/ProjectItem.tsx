"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { roleAccent } from "@/lib/data/roleColor";
import type { ProductProject, Project } from "@/lib/data/types";

const statusLabel = {
	Production: "LIVE",
	"In Progress": "WIP",
	Completed: "DONE",
	Archived: "DONE",
} as const;

function MetaRow({ label, value }: { label: string; value: string }) {
	return (
		<Box sx={{ display: "flex", gap: 1.5 }}>
			<Typography
				fontFamily="code"
				fontSize={12}
				fontWeight={700}
				sx={{ color: "success.500", flexShrink: 0 }}
			>
				{label}
			</Typography>
			<Typography fontSize={13} sx={{ color: "text.secondary" }}>
				{value}
			</Typography>
		</Box>
	);
}

export function ProjectItem({
	project,
	productProject,
}: {
	project: Project;
	productProject: ProductProject;
}) {
	const accent = roleAccent(productProject.role);
	const hasMeta = project.core_tech || project.database || project.deployment;

	return (
		<Box
			id={project.id}
			sx={{
				scrollMarginTop: "80px",
				bgcolor: "background.surface",
				border: "1px solid",
				borderColor: "divider",
				borderLeft: "3px solid",
				borderLeftColor: accent,
				borderRadius: 8,
				p: 2.5,
			}}
		>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
				<Box
					sx={{
						fontFamily: "code",
						fontSize: 11,
						fontWeight: 700,
						color: accent,
						border: "1px solid",
						borderColor: accent,
						borderRadius: 999,
						px: 1.25,
						py: 0.25,
					}}
				>
					{productProject.role}
				</Box>
				<Typography
					fontFamily="code"
					fontSize={11}
					fontWeight={700}
					sx={{ color: "text.tertiary" }}
				>
					[{statusLabel[project.status] ?? "DONE"}]
				</Typography>
			</Box>

			<Typography sx={{ fontSize: 16, fontWeight: 700, mb: 0.75 }}>
				{project.name}
			</Typography>

			{project.description && (
				<Typography
					sx={{
						fontSize: 14,
						color: "text.secondary",
						lineHeight: 1.6,
						mb: 1.5,
					}}
				>
					{project.description}
				</Typography>
			)}

			{project.tags.length > 0 && (
				<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
					{project.tags.map((tag) => (
						<Box
							key={tag}
							sx={{
								fontFamily: "code",
								fontSize: 11,
								color: "text.secondary",
								border: "1px solid",
								borderColor: "divider",
								borderRadius: 999,
								px: 1.25,
								py: 0.5,
							}}
						>
							{tag}
						</Box>
					))}
				</Box>
			)}

			{hasMeta && (
				<Box
					sx={{
						mt: 2,
						pt: 2,
						borderTop: "1px solid",
						borderColor: "divider",
						display: "flex",
						flexDirection: "column",
						gap: 0.75,
					}}
				>
					{project.core_tech && (
						<MetaRow label="Core" value={project.core_tech} />
					)}
					{project.database && <MetaRow label="DB" value={project.database} />}
					{project.deployment && (
						<MetaRow label="Deploy" value={project.deployment} />
					)}
				</Box>
			)}
		</Box>
	);
}
