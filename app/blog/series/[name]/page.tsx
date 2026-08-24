import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeriesDetailClient } from "@/components/blog/SeriesDetailClient";
import { getPostsBySeries } from "@/lib/blog/posts";
import { getSeriesInfo, SERIES_LIST } from "@/lib/blog/series";

export function generateStaticParams() {
	return SERIES_LIST.map((s) => ({ name: s.name }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ name: string }>;
}): Promise<Metadata> {
	const { name } = await params;
	const series = getSeriesInfo(name);
	if (!series) return {};

	return {
		title: series.title,
		description: series.description,
		openGraph: { title: series.title, description: series.description },
	};
}

export default async function SeriesPage({
	params,
}: {
	params: Promise<{ name: string }>;
}) {
	const { name } = await params;
	const series = getSeriesInfo(name);
	if (!series) notFound();

	return <SeriesDetailClient series={series} posts={getPostsBySeries(name)} />;
}
