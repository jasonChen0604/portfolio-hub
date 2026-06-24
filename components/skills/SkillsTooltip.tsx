"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Chip from "@mui/joy/Chip";
import Link from "next/link";
import type { SkillTooltipData } from "@/lib/skills/tooltipLookup";
import { useLang } from "@/lib/i18n/context";

const levelColor = {
  expert: "#4f9cf9",
  proficient: "#6bcb77",
  familiar: "#94a3b8",
} as const;

const t = {
  en: { projects: "projects", more: "more", noProducts: "No linked products" },
  zh: { projects: "個專案", more: "個更多", noProducts: "無連結產品" },
};

const TOOLTIP_W = 260;
const OFFSET = 8;

function calcPos(anchor: Element): { top: number; left: number } {
  const r = anchor.getBoundingClientRect();
  const margin = 8;
  let top = r.bottom + OFFSET;
  let left = Math.max(margin, Math.min(r.left + r.width / 2 - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - margin));
  if (top + 200 > window.innerHeight) top = r.top - OFFSET - 200;
  return { top, left };
}

export function SkillsTooltip({
  data,
  anchor,
  onClose,
}: {
  data: SkillTooltipData | null;
  anchor: Element | null;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const tx = t[lang];
  const nodeRef = useRef<HTMLDivElement | null>(null);

  // sync position directly on scroll — bypasses React re-render for zero lag
  useEffect(() => {
    if (!anchor || !nodeRef.current) return;
    const el = nodeRef.current;

    const update = () => {
      const { top, left } = calcPos(anchor);
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [anchor]);

  const initialPos = anchor ? calcPos(anchor) : { top: 0, left: 0 };

  return (
    <AnimatePresence>
      {data && anchor && (
        <motion.div
          ref={nodeRef}
          key={data.skillTag}
          initial={{ opacity: 0, scale: 0.93, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed",
            top: initialPos.top,
            left: initialPos.left,
            width: TOOLTIP_W,
            zIndex: 200,
            background: "var(--joy-palette-background-surface)",
            border: "1px solid var(--joy-palette-neutral-outlinedBorder)",
            borderRadius: 12,
            padding: "14px 16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            cursor: "default",
            pointerEvents: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 6,
              right: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              color: "var(--joy-palette-neutral-500)",
              lineHeight: 1,
            }}
            aria-label="close"
          >
            ×
          </button>

          {/* header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
            <Typography level="title-sm">{data.skillTag}</Typography>
            {data.level && (
              <Chip
                size="sm"
                variant="soft"
                sx={{
                  bgcolor: `color-mix(in srgb, ${levelColor[data.level as keyof typeof levelColor] ?? "#94a3b8"} 18%, transparent)`,
                  color: levelColor[data.level as keyof typeof levelColor] ?? "#94a3b8",
                }}
              >
                {data.level}
              </Chip>
            )}
            <Typography level="body-xs" color="neutral" sx={{ ml: "auto", whiteSpace: "nowrap" }}>
              {data.projectCount} {tx.projects}
            </Typography>
          </Box>

          {/* product list */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {data.topProducts.length === 0 ? (
              <Typography level="body-sm" color="neutral">{tx.noProducts}</Typography>
            ) : (
              <>
                {data.topProducts.map((prod, i) => (
                  <motion.div
                    key={prod.productSlug}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Box
                      component={Link}
                      href={`/product/${prod.productSlug}`}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        textDecoration: "none",
                        borderRadius: "sm",
                        px: 0.75,
                        py: 0.5,
                        "&:hover": { bgcolor: "var(--joy-palette-neutral-softBg)" },
                      }}
                    >
                      <Typography level="body-sm" fontWeight="md" sx={{ color: "text.primary" }}>
                        {prod.productName}
                      </Typography>
                      <Typography level="body-xs" color="neutral" sx={{ ml: 1, whiteSpace: "nowrap" }}>
                        {prod.projectCount} {tx.projects}
                      </Typography>
                    </Box>
                  </motion.div>
                ))}
                {data.extraCount > 0 && (
                  <Typography level="body-xs" color="neutral" sx={{ pl: 0.75, pt: 0.25 }}>
                    … {data.extraCount} {tx.more}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
