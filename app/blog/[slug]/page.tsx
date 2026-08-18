import { marked } from "marked";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { getAllSlugs, getPostBySlug, getSeriesNav } from "@/lib/blog/posts";

// 文章內文連結一律指向外部來源（Medium 原文、GitHub 等），一律開新分頁。
const renderer = new marked.Renderer();
renderer.link = ({ href, title, tokens }) => {
	const text = renderer.parser?.parseInline(tokens) ?? "";
	const titleAttr = title ? ` title="${title}"` : "";
	return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
};

export function generateStaticParams() {
	return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const post = getPostBySlug(slug);
	if (!post) return {};

	return {
		title: post.title,
		description: post.excerpt,
		openGraph: {
			type: "article",
			title: post.title,
			description: post.excerpt,
			publishedTime: post.publishedAt,
			authors: [post.author],
			images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
		},
		twitter: {
			card: "summary_large_image",
			title: post.title,
			description: post.excerpt,
			images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
		},
		other: {
			"application/ld+json": JSON.stringify({
				"@context": "https://schema.org",
				"@type": "BlogPosting",
				headline: post.title,
				description: post.excerpt,
				datePublished: post.publishedAt,
				dateModified: post.publishedAt,
				...(post.coverImageUrl ? { image: [post.coverImageUrl] } : {}),
				author: { "@type": "Person", name: post.author },
				keywords: post.tags.join(", "),
			}),
		},
	};
}

export default async function BlogPostPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const post = getPostBySlug(slug);
	if (!post) notFound();

	const html = marked.parse(post.content, { async: false, renderer }) as string;
	const seriesNav = getSeriesNav(post);

	return <BlogPostBody post={post} html={html} seriesNav={seriesNav} />;
}
