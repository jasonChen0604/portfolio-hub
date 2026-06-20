import type { Metadata } from "next";
import { HomeClient } from "@/components/home/HomeClient";
import { meta } from "@/lib/data/loaders";

export const metadata: Metadata = {
  title: "Jason Chen — Full-Stack Engineer",
  description: meta.profile.summary,
  openGraph: {
    title: "Jason Chen — Full-Stack Engineer",
    description: meta.profile.summary,
    type: "profile",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Jason Chen",
      jobTitle: meta.profile.title,
      email: meta.profile.email,
      sameAs: [
        "https://github.com/jasonChen0604",
        "https://www.linkedin.com/in/jason-cj-chen",
      ],
      knowsAbout: meta.linkedin.skills_list.slice(0, 10),
    }),
  },
};

export default function HomePage() {
  return <HomeClient meta={meta} />;
}
