"use client";

import Box from "@mui/joy/Box";

interface Props {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
}

export function SkillsSearch({ value, onChange, placeholder }: Props) {
	return (
		<Box sx={{ position: "relative", maxWidth: 460 }}>
			<Box
				component="svg"
				width={16}
				height={16}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				sx={{
					position: "absolute",
					left: 18,
					top: "50%",
					transform: "translateY(-50%)",
					pointerEvents: "none",
					color: "text.secondary",
				}}
			>
				<circle cx="11" cy="11" r="7" />
				<line x1="21" y1="21" x2="16.65" y2="16.65" />
			</Box>
			<Box
				component="input"
				value={value}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
					onChange(e.target.value)
				}
				placeholder={placeholder}
				sx={{
					width: "100%",
					fontFamily: "code",
					fontSize: 14,
					color: "text.primary",
					bgcolor: "transparent",
					border: "1px solid",
					borderColor: "divider",
					borderRadius: 999,
					px: "44px",
					py: 1.625,
					outline: "none",
					transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
					"&:hover": { borderColor: "primary.outlinedBorder" },
					"&:focus": {
						borderColor: "primary.500",
						bgcolor: "background.surface",
						boxShadow: "0 0 0 4px var(--joy-palette-primary-outlinedBorder)",
					},
				}}
			/>
			{value && (
				<Box
					component="button"
					onClick={() => onChange("")}
					aria-label="clear"
					sx={{
						position: "absolute",
						right: 8,
						top: "50%",
						transform: "translateY(-50%)",
						width: 24,
						height: 24,
						borderRadius: "50%",
						border: "none",
						bgcolor: "divider",
						color: "text.primary",
						cursor: "pointer",
						fontSize: 14,
						lineHeight: 1,
						transition: "background 0.2s",
						"&:hover": { bgcolor: "primary.outlinedBorder" },
					}}
				>
					×
				</Box>
			)}
		</Box>
	);
}
