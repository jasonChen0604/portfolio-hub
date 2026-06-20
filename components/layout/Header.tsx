"use client";

import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import IconButton from "@mui/joy/IconButton";
import Button from "@mui/joy/Button";
import { useColorScheme } from "@mui/joy/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n/context";

const navItems = [
  { href: "/", en: "Home", zh: "首頁" },
  { href: "/skills", en: "Skills", zh: "技能" },
  { href: "/projects", en: "Projects", zh: "專案" },
  { href: "/experience", en: "Experience", zh: "產品經歷" },
  { href: "/about", en: "About", zh: "關於此站" },
];

function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  return (
    <IconButton
      variant="plain"
      color="neutral"
      size="sm"
      onClick={() => setMode(mode === "dark" ? "light" : "dark")}
      aria-label="Toggle dark mode"
    >
      {mode === "dark" ? "☀️" : "🌙"}
    </IconButton>
  );
}

export function Header() {
  const { lang, setLang } = useLang();
  const pathname = usePathname();

  return (
    <Sheet
      component="header"
      variant="outlined"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        px: { xs: 2, md: 4 },
        py: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        backdropFilter: "blur(8px)",
        bgcolor: "background.surface",
      }}
    >
      <Link href="/" style={{ textDecoration: "none" }}>
        <Typography level="title-md" fontWeight="bold" color="primary">
          Jason Chen
        </Typography>
      </Link>

      <Box
        component="nav"
        sx={{ display: { xs: "none", md: "flex" }, gap: 0.5 }}
      >
        {navItems.map((item) => (
          <Button
            key={item.href}
            component={Link}
            href={item.href}
            variant={pathname === item.href ? "soft" : "plain"}
            color={pathname === item.href ? "primary" : "neutral"}
            size="sm"
          >
            {lang === "zh" ? item.zh : item.en}
          </Button>
        ))}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          variant="outlined"
          color="neutral"
          size="sm"
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
          sx={{ minWidth: 48 }}
        >
          {lang === "en" ? "中文" : "EN"}
        </Button>
        <ThemeToggle />
      </Box>
    </Sheet>
  );
}
