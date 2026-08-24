export interface SeriesInfo {
	name: string;
	title: string;
	description: string;
	coverImageUrl: string;
}

// ponytail: 系列的展示 metadata（封面/簡介）獨立於單篇文章之外，未來新系列（k3s 上線後維運、GitLab 維運）先加在這裡即可，文章之後再補。
export const SERIES_LIST: SeriesInfo[] = [
	{
		name: "k3s",
		title: "Running Production Solo",
		description:
			"My k3s high-availability journey — every incident, diagnosis, and fix from building out a self-hosted production cluster alone.",
		coverImageUrl:
			"https://miro.medium.com/v2/resize:fit:1400/1*bEjitWGES2_llzaYGCA5KA.png",
	},
	{
		name: "built-with-claude-code",
		title: "Built With Claude Code",
		description:
			"Small tools and workflows I built with Claude Code to solve problems I ran into along the way.",
		coverImageUrl:
			"https://miro.medium.com/v2/resize:fit:1400/1*zVFHDPk9JzLqIbDTPbULhw.png",
	},
];

export function getSeriesInfo(name: string): SeriesInfo | undefined {
	return SERIES_LIST.find((s) => s.name === name);
}
