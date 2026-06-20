"use client";

import Box from "@mui/joy/Box";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Button from "@mui/joy/Button";
import Typography from "@mui/joy/Typography";
import { useLang } from "@/lib/i18n/context";

const t = {
  en: {
    domain: "Domain",
    status: "Status",
    category: "Category",
    all: "All",
    reset: "Reset",
    showing: (n: number, total: number) => `Showing ${n} of ${total} projects`,
  },
  zh: {
    domain: "領域",
    status: "狀態",
    category: "類型",
    all: "全部",
    reset: "重置",
    showing: (n: number, total: number) => `顯示 ${n} / ${total} 個專案`,
  },
};

export interface Filters {
  domain: string;
  status: string;
  category: string;
}

export function ProjectFilters({
  filters,
  setFilters,
  domains,
  statuses,
  categories,
  count,
  total,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  domains: string[];
  statuses: string[];
  categories: string[];
  count: number;
  total: number;
}) {
  const { lang } = useLang();
  const tx = t[lang];

  function reset() {
    setFilters({ domain: "", status: "", category: "" });
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 1.5,
          alignItems: "center",
        }}
      >
        <Select
          size="sm"
          placeholder={tx.domain}
          value={filters.domain || null}
          onChange={(_, v) => setFilters({ ...filters, domain: v ?? "" })}
          sx={{ minWidth: 140 }}
        >
          <Option value="">{tx.all}</Option>
          {domains.map((d) => (
            <Option key={d} value={d}>
              {d}
            </Option>
          ))}
        </Select>

        <Select
          size="sm"
          placeholder={tx.status}
          value={filters.status || null}
          onChange={(_, v) => setFilters({ ...filters, status: v ?? "" })}
          sx={{ minWidth: 140 }}
        >
          <Option value="">{tx.all}</Option>
          {statuses.map((s) => (
            <Option key={s} value={s}>
              {s}
            </Option>
          ))}
        </Select>

        <Select
          size="sm"
          placeholder={tx.category}
          value={filters.category || null}
          onChange={(_, v) => setFilters({ ...filters, category: v ?? "" })}
          sx={{ minWidth: 160 }}
        >
          <Option value="">{tx.all}</Option>
          {categories.map((c) => (
            <Option key={c} value={c}>
              {c}
            </Option>
          ))}
        </Select>

        {(filters.domain || filters.status || filters.category) && (
          <Button size="sm" variant="plain" color="neutral" onClick={reset}>
            {tx.reset}
          </Button>
        )}
      </Box>
      <Typography level="body-sm" color="neutral">
        {tx.showing(count, total)}
      </Typography>
    </Box>
  );
}
