"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import type { Resume } from "@/lib/data/types";
import { useLang } from "@/lib/i18n/context";

const t = {
	en: {
		title: "Experience",
		subtitle: "Work history, education, and certifications.",
		workExperience: "Work Experience",
		education: "Education",
		certifications: "Certifications",
		present: "Present",
	},
	zh: {
		title: "經歷",
		subtitle: "工作經歷、學歷與證照。",
		workExperience: "工作經歷",
		education: "學歷",
		certifications: "證照",
		present: "現在",
	},
};

const INDENT = 44;

function SectionHeading({ index, title }: { index: number; title: string }) {
	return (
		<Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 3 }}>
			<Typography
				fontFamily="code"
				fontSize={13}
				fontWeight={700}
				sx={{ color: "primary.500", width: INDENT - 24, flexShrink: 0 }}
			>
				{String(index).padStart(2, "0")}
			</Typography>
			<Typography level="h2" sx={{ fontSize: 22, fontWeight: 700 }}>
				{title}
			</Typography>
		</Box>
	);
}

export function ExperienceClient({
	resumeEn,
	resumeZh,
}: {
	resumeEn: Resume;
	resumeZh: Resume;
}) {
	const { lang } = useLang();
	const tx = t[lang];
	const resume = lang === "zh" ? resumeZh : resumeEn;

	return (
		<Box
			sx={{
				maxWidth: 800,
				mx: "auto",
				px: { xs: 2, md: 6 },
				pt: { xs: 6, md: 10 },
				pb: { xs: 6, md: 10 },
			}}
		>
			<Typography
				level="h1"
				sx={{
					fontSize: { xs: 32, md: 44 },
					fontWeight: 800,
					letterSpacing: "-0.02em",
					mb: 1.5,
				}}
			>
				{tx.title}
			</Typography>
			<Typography
				fontFamily="code"
				sx={{ fontSize: 16, color: "text.secondary", mb: 4 }}
			>
				{tx.subtitle}
			</Typography>
			<Box sx={{ borderTop: "1px solid", borderColor: "divider", mb: 5 }} />

			{resume.work_experience.length > 0 && (
				<Box
					sx={{
						mb: 6,
						pb: 6,
						borderBottom: "1px solid",
						borderColor: "divider",
					}}
				>
					<SectionHeading index={1} title={tx.workExperience} />
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 4,
							pl: `${INDENT}px`,
						}}
					>
						{resume.work_experience.map((job) => (
							<Box key={`${job.company}-${job.title}-${job.start}`}>
								<Typography sx={{ fontSize: 17, fontWeight: 700 }}>
									{job.title}
								</Typography>
								<Typography
									fontFamily="code"
									fontSize={14}
									sx={{ color: "primary.500", mt: 0.5 }}
								>
									{job.company}
								</Typography>
								<Typography
									fontFamily="code"
									fontSize={12}
									sx={{ color: "text.secondary", mt: 0.25, mb: 1.5 }}
								>
									{job.start} – {job.end ?? tx.present}
								</Typography>
								{job.summary && (
									<Typography
										sx={{
											fontSize: 14,
											color: "text.secondary",
											lineHeight: 1.7,
											mb: job.highlights.length ? 1.5 : 0,
										}}
									>
										{job.summary}
									</Typography>
								)}
								{job.highlights.length > 0 && (
									<Box
										component="ul"
										sx={{
											pl: 2.5,
											m: 0,
											display: "flex",
											flexDirection: "column",
											gap: 0.5,
										}}
									>
										{job.highlights.map((h) => (
											<Typography
												key={h}
												component="li"
												sx={{
													fontSize: 14,
													color: "text.secondary",
													lineHeight: 1.6,
												}}
											>
												{h}
											</Typography>
										))}
									</Box>
								)}
							</Box>
						))}
					</Box>
				</Box>
			)}

			{resume.education.length > 0 && (
				<Box
					sx={{
						mb: 6,
						pb: 6,
						borderBottom: "1px solid",
						borderColor: "divider",
					}}
				>
					<SectionHeading index={2} title={tx.education} />
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 2.5,
							pl: `${INDENT}px`,
						}}
					>
						{resume.education.map((ed) => (
							<Box key={`${ed.school}-${ed.degree}`}>
								<Typography sx={{ fontSize: 17, fontWeight: 700 }}>
									{ed.school}
								</Typography>
								<Typography
									fontFamily="code"
									fontSize={14}
									sx={{ color: "text.secondary", mt: 0.5 }}
								>
									{ed.degree}
								</Typography>
								<Typography
									fontFamily="code"
									fontSize={12}
									sx={{ color: "text.secondary", mt: 0.25 }}
								>
									{ed.start} – {ed.end}
								</Typography>
							</Box>
						))}
					</Box>
				</Box>
			)}

			{resume.certifications.length > 0 && (
				<Box>
					<SectionHeading index={3} title={tx.certifications} />
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 1.25,
							pl: `${INDENT}px`,
						}}
					>
						{resume.certifications.map((cert) => (
							<Box
								key={`${cert.name}-${cert.date}`}
								sx={{
									fontFamily: "code",
									fontSize: 13,
									color: "text.secondary",
									bgcolor: "background.surface",
									border: "1px solid",
									borderColor: "divider",
									borderRadius: 999,
									px: 2,
									py: 1,
								}}
							>
								{cert.name} · {cert.issuer} · {cert.date}
							</Box>
						))}
					</Box>
				</Box>
			)}
		</Box>
	);
}
