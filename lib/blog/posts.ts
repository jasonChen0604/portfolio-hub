import fs from "fs";
import matter from "gray-matter";
import path from "path";

// ponytail: 部落格文章單語系（英文），只抓 Jason Chen 本人的文章，不走 tech-profile/ 的雙語 JSON 流程。
const POSTS_DIR = path.join(process.cwd(), "content/blog");

export interface BlogSeries {
	name: string;
	part: number;
}

export interface BlogPostMeta {
	slug: string;
	title: string;
	author: string;
	publishedAt: string;
	excerpt: string;
	tags: string[];
	sourceUrl?: string;
	coverImageUrl?: string;
	series?: BlogSeries;
}

export interface BlogPost extends BlogPostMeta {
	content: string;
}

function readPostFile(slug: string): BlogPost {
	const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.md`), "utf8");
	const { data, content } = matter(raw);
	return {
		slug: data.slug || slug,
		title: data.title || slug,
		author: data.author || "",
		publishedAt: data.publishedAt || "",
		excerpt: data.excerpt || "",
		tags: data.tags || [],
		sourceUrl: data.sourceUrl || undefined,
		coverImageUrl: data.coverImageUrl || undefined,
		series: data.series || undefined,
		content,
	};
}

export function getAllSlugs(): string[] {
	if (!fs.existsSync(POSTS_DIR)) return [];
	return fs
		.readdirSync(POSTS_DIR)
		.filter((file) => file.endsWith(".md"))
		.map((file) => file.replace(/\.md$/, ""));
}

export function getAllPosts(): BlogPostMeta[] {
	return getAllSlugs()
		.map((slug) => readPostFile(slug))
		.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | null {
	if (!getAllSlugs().includes(slug)) return null;
	return readPostFile(slug);
}

export function getSeriesNav(post: BlogPostMeta): {
	prev?: BlogPostMeta;
	next?: BlogPostMeta;
} {
	if (!post.series) return {};
	const siblings = getAllPosts()
		.filter((p) => p.series?.name === post.series?.name)
		.sort((a, b) => (a.series?.part ?? 0) - (b.series?.part ?? 0));
	const index = siblings.findIndex((p) => p.slug === post.slug);
	return {
		prev: siblings[index - 1],
		next: siblings[index + 1],
	};
}
