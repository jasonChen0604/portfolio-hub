import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Link from "@mui/joy/Link";
import Divider from "@mui/joy/Divider";

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 8,
        py: 4,
        px: { xs: 2, md: 4 },
        textAlign: "center",
      }}
    >
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 2, flexWrap: "wrap" }}>
        <Link
          href="mailto:jason.chen.develop@gmail.com"
          level="body-sm"
          color="neutral"
        >
          ✉️ jason.chen.develop@gmail.com
        </Link>
        <Link
          href="https://www.linkedin.com/in/jason-cj-chen"
          target="_blank"
          rel="noopener noreferrer"
          level="body-sm"
          color="neutral"
        >
          💼 LinkedIn
        </Link>
        <Link
          href="https://github.com/jasonChen0604"
          target="_blank"
          rel="noopener noreferrer"
          level="body-sm"
          color="neutral"
        >
          🐙 GitHub
        </Link>
      </Box>
      <Typography level="body-xs" color="neutral">
        © {new Date().getFullYear()} Jason Chen. Built with Next.js + Joy UI.
      </Typography>
    </Box>
  );
}
