// Accent color per project role, matching the product-detail design.
// Keyed by substring so variants like "Backend (NestJS)" / "Backend (PHP)"
// still resolve. First match wins; unknown roles fall back to neutral gray.
const ROLE_COLORS: [RegExp, string][] = [
	[/frontend/i, "#6aa7f4"], // blue
	[/nest/i, "#00bcc5"], // teal
	[/php|laravel/i, "#21bfa0"], // green
	[/backend/i, "#21bfa0"], // green (generic backend)
	[/devops|infra|ci\/?cd/i, "#f5a623"], // orange
	[/kubernetes|k8s/i, "#b085f5"], // purple
	[/mobile|ios|android/i, "#f57ab0"], // pink
	[/mcp|ai|llm/i, "#e0736b"], // coral
];

export function roleAccent(role: string): string {
	for (const [re, color] of ROLE_COLORS) {
		if (re.test(role)) return color;
	}
	return "#8b93a7"; // neutral fallback
}
