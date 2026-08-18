import type { Metadata } from "next";
import { BlogListClient } from "@/components/blog/BlogListClient";
import { getAllPosts } from "@/lib/blog/posts";

export const metadata: Metadata = {
	title: "Blog",
	description: "Notes and write-ups on what Jason Chen has built and broken.",
	openGraph: {
		title: "Blog — Jason Chen",
		description: "Notes and write-ups on what Jason Chen has built and broken.",
	},
};

export default function BlogPage() {
	return <BlogListClient posts={getAllPosts()} />;
}
