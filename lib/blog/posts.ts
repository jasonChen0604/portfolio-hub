import fs from "fs";
import path from "path";
import matter from "gray-matter";

// ponytail: 部落格文章單語系（英文），只抓 Jason Chen 本人的文章，不走 tech-profile/ 的雙語 JSON 流程。
const POSTS_DIR = path.join(process.cwd(), "content/blog");

export interface BlogPostMeta {
	slug: string;
	title: string;
	author: string;
	publishedAt: string;
	excerpt: string;
	tags: string[];
	sourceUrl?: string;
	coverImageUrl?: string;
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
