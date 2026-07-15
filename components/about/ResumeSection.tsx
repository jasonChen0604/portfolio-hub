"use client";

import Box from "@mui/joy/Box";
import Chip from "@mui/joy/Chip";
import Divider from "@mui/joy/Divider";
import Typography from "@mui/joy/Typography";
import type { Resume } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";
import { AboutSection } from "./AboutSection";

const t = {
	en: {
		workExperience: "Work Experience",
		education: "Education",
		certifications: "Certifications",
		present: "Present",
	},
	zh: {
		workExperience: "工作經歷",
		education: "學歷",
		certifications: "證照",
		present: "現在",
	},
};

export function ResumeSection({ resume }: { resume: Resume }) {
	const { lang } = useLang();
	const tx = t[lang];
	const hasAny =
		resume.work_experience.length > 0 ||
		resume.education.length > 0 ||
		resume.certifications.length > 0;

	if (!hasAny) return null;

	return (
		<Box>
			{resume.work_experience.length > 0 && (
				<AboutSection title={tx.workExperience}>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
						{resume.work_experience.map((job) => (
							<Box key={`${job.company}-${job.title}-${job.start}`}>
								<Typography level="title-md">{job.title}</Typography>
								<Typography level="body-sm" color="primary">
									{job.company}
								</Typography>
								<Typography level="body-xs" color="neutral" sx={{ mb: 1 }}>
									{job.start} – {job.end ?? tx.present}
								</Typography>
								{job.summary && (
									<Typography
										level="body-sm"
										sx={{ mb: job.highlights.length ? 1 : 0 }}
									>
										{job.summary}
									</Typography>
								)}
								{job.highlights.length > 0 && (
									<Box component="ul" sx={{ pl: 3, m: 0 }}>
										{job.highlights.map((h) => (
											<Typography key={h} component="li" level="body-sm">
												{h}
											</Typography>
										))}
									</Box>
								)}
							</Box>
						))}
					</Box>
				</AboutSection>
			)}

			{resume.education.length > 0 && (
				<>
					<Divider />
					<Box sx={{ mt: 5 }}>
						<AboutSection title={tx.education}>
							<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
								{resume.education.map((ed) => (
									<Box key={`${ed.school}-${ed.degree}`}>
										<Typography level="title-md">{ed.school}</Typography>
										<Typography level="body-sm" color="neutral">
											{ed.degree}
										</Typography>
										<Typography level="body-xs" color="neutral">
											{ed.start} – {ed.end}
										</Typography>
									</Box>
								))}
							</Box>
						</AboutSection>
					</Box>
				</>
			)}

			{resume.certifications.length > 0 && (
				<>
					<Divider />
					<Box sx={{ mt: 5 }}>
						<AboutSection title={tx.certifications}>
							<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
								{resume.certifications.map((cert) => (
									<Chip
										key={`${cert.name}-${cert.date}`}
										variant="soft"
										color="neutral"
									>
										{cert.name} · {cert.issuer} · {cert.date}
									</Chip>
								))}
							</Box>
						</AboutSection>
					</Box>
				</>
			)}
		</Box>
	);
}
