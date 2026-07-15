"use client";

import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Link from "next/link";
import { useLang } from "@/lib/i18n/context";
import type { ProfileMeta } from "@/lib/data/types";

const t = {
  en: {
    cta: "View Products",
    ctaContact: "Contact",
  },
  zh: {
    cta: "查看產品",
    ctaContact: "聯絡我",
  },
};

export function HeroSection({ meta }: { meta: ProfileMeta }) {
  const { lang } = useLang();
  const tx = t[lang];

  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        px: { xs: 2, md: 4 },
        maxWidth: 800,
        mx: "auto",
        textAlign: "center",
      }}
    >
      <Typography level="h1" sx={{ mb: 1, fontSize: { xs: "2rem", md: "3rem" } }}>
        {meta.profile.name}
      </Typography>
      <Typography level="h3" color="primary" fontWeight="normal" sx={{ mb: 3 }}>
        {meta.profile.title}
      </Typography>
      <Typography
        level="body-lg"
        color="neutral"
        sx={{ mb: 4, maxWidth: 640, mx: "auto", lineHeight: 1.7 }}
      >
        {meta.profile.summary}
      </Typography>
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
        <Button component={Link} href="/product" size="lg">
          {tx.cta}
        </Button>
        <Button
          component="a"
          href={`mailto:${meta.profile.email}`}
          size="lg"
          variant="outlined"
          color="neutral"
        >
          {tx.ctaContact}
        </Button>
      </Box>
    </Box>
  );
}
