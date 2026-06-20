import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import type { ReactNode } from "react";

export function AboutSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ mb: 5 }}>
      <Typography level="h3" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}
