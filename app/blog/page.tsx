import type { Metadata } from "next";
import { SeriesListClient } from "@/components/blog/SeriesListClient";
import { getAllPosts } from "@/lib/blog/posts";
import { SERIES_LIST } from "@/lib/blog/series";

export const metadata: Metadata = {
	title: "Blog",
	description: "Series of write-ups on what Jason Chen has built and broken.",
	openGraph: {
		title: "Blog — Jason Chen",
		description: "Series of write-ups on what Jason Chen has built and broken.",
	},
};

export default function BlogPage() {
	return <SeriesListClient seriesList={SERIES_LIST} posts={getAllPosts()} />;
}
