import Box from "@mui/joy/Box";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import { meta } from "@/lib/data/loaders";

export function Footer() {
	return (
		<Box
			component="footer"
			sx={{
				maxWidth: 960,
				mx: "auto",
				mt: 8,
				py: 4.5,
				px: { xs: 2, md: 6 },
				borderTop: "1px solid",
				borderColor: "divider",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				flexWrap: "wrap",
				gap: 2,
			}}
		>
			<Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
				<Link
					href={`mailto:${meta.profile.email}`}
					level="body-sm"
					sx={{ color: "text.secondary", "&:hover": { color: "primary.500" } }}
				>
					Email
				</Link>
				<Link
					href="https://www.linkedin.com/in/jason-cj-chen"
					target="_blank"
					rel="noopener noreferrer"
					level="body-sm"
					sx={{ color: "text.secondary", "&:hover": { color: "primary.500" } }}
				>
					LinkedIn
				</Link>
				<Link
					href="https://github.com/jasonChen0604"
					target="_blank"
					rel="noopener noreferrer"
					level="body-sm"
					sx={{ color: "text.secondary", "&:hover": { color: "primary.500" } }}
				>
					GitHub
				</Link>
				<Link
					href="https://jason-chen-0604.medium.com/"
					target="_blank"
					rel="noopener noreferrer"
					level="body-sm"
					sx={{ color: "text.secondary", "&:hover": { color: "primary.500" } }}
				>
					Medium
				</Link>
			</Box>
			<Typography
				fontFamily="code"
				level="body-xs"
				sx={{ color: "text.secondary" }}
			>
				© {new Date().getFullYear()} Jason Chen
			</Typography>
		</Box>
	);
}
