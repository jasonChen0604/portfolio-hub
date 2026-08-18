// Visual/layout rules for the 3D skill mind map.
// CategoryConfig.skills is the authoritative reclassification of skill tags.
// Skills not listed in any category are dropped from the graph.

export interface CategoryConfig {
	id: string;
	label: string;
	labelZh: string;
	domainId: string;
	skills: string[];
}

export interface DomainVisualConfig {
	domainId: string;
	label: string;
	labelZh: string;
	color: string;
	domainNodeSize: number;
	categoryNodeSize: number;
	leafNodeSize: number;
	spreadFactor: number;
	/** Used when the domain has no corresponding entry in domains-*.json */
	icon?: string;
	summaryEn?: string;
	summaryZh?: string;
}

export interface GraphLayoutConfig {
	initialCameraZ: number;
	cameraFlyDuration: number;
	focusDistance: number;
}

export const domainVisualConfigs: DomainVisualConfig[] = [
	{
		domainId: "frontend",
		label: "Frontend",
		labelZh: "前端",
		color: "#4f9cf9",
		domainNodeSize: 80,
		categoryNodeSize: 40,
		leafNodeSize: 20,
		spreadFactor: 1.0,
	},
	{
		domainId: "backend",
		label: "Backend",
		labelZh: "後端",
		color: "#6bcb77",
		domainNodeSize: 80,
		categoryNodeSize: 40,
		leafNodeSize: 20,
		spreadFactor: 1.0,
	},
	{
		domainId: "cloud",
		label: "Cloud",
		labelZh: "雲服務",
		color: "#60a5fa",
		domainNodeSize: 70,
		categoryNodeSize: 35,
		leafNodeSize: 18,
		spreadFactor: 1.1,
		icon: "☁️",
		summaryEn:
			"Firebase, Azure, and Google Cloud services used across mobile, AI, and enterprise projects.",
		summaryZh:
			"橫跨行動、AI 與企業專案所使用的 Firebase、Azure 與 Google Cloud 服務。",
	},
	{
		domainId: "database",
		label: "Database",
		labelZh: "資料庫",
		color: "#f6a623",
		domainNodeSize: 70,
		categoryNodeSize: 35,
		leafNodeSize: 18,
		spreadFactor: 1.0,
	},
	{
		domainId: "devops",
		label: "DevOps",
		labelZh: "維運",
		color: "#f87171",
		domainNodeSize: 70,
		categoryNodeSize: 35,
		leafNodeSize: 18,
		spreadFactor: 1.0,
	},
	{
		domainId: "ai_llm",
		label: "AI / LLM",
		labelZh: "AI / LLM",
		color: "#a78bfa",
		domainNodeSize: 65,
		categoryNodeSize: 32,
		leafNodeSize: 18,
		spreadFactor: 1.2,
	},
	{
		domainId: "mobile",
		label: "Mobile",
		labelZh: "行動端",
		color: "#34d399",
		domainNodeSize: 65,
		categoryNodeSize: 32,
		leafNodeSize: 18,
		spreadFactor: 1.0,
	},
	{
		domainId: "languages",
		label: "Languages",
		labelZh: "語言",
		color: "#e879f9",
		domainNodeSize: 60,
		categoryNodeSize: 0,
		leafNodeSize: 25,
		spreadFactor: 1.0,
	},
	{
		domainId: "tools",
		label: "Tools",
		labelZh: "工具",
		color: "#fb923c",
		domainNodeSize: 60,
		categoryNodeSize: 30,
		leafNodeSize: 18,
		spreadFactor: 1.0,
	},
	{
		domainId: "other",
		label: "Other",
		labelZh: "其他",
		color: "#94a3b8",
		domainNodeSize: 55,
		categoryNodeSize: 0,
		leafNodeSize: 20,
		spreadFactor: 1.0,
	},
];

// categoryNodeSize: 0 means languages has no mid-layer (flat: domain → skill)

export const categoryConfigs: CategoryConfig[] = [
	// ── Frontend ──
	{
		id: "fe-ui",
		label: "UI Frameworks",
		labelZh: "UI 框架",
		domainId: "frontend",
		skills: ["React", "Next.js", "Vue 3", "Nuxt 3"],
	},
	{
		id: "fe-state",
		label: "State Management",
		labelZh: "狀態管理",
		domainId: "frontend",
		skills: ["Redux", "Redux-Saga", "Pinia", "Zustand"],
	},
	{
		id: "fe-comp",
		label: "Component Libraries",
		labelZh: "元件庫",
		domainId: "frontend",
		skills: [
			"Ant Design",
			"MUI",
			"MUI Joy",
			"Joy UI",
			"Tailwind CSS",
			"Bootstrap",
			"Vuetify",
			"Quasar",
			"Ant Design Vue",
			"CKEditor",
			"FullCalendar",
		],
	},
	{
		id: "fe-style",
		label: "Styling",
		labelZh: "樣式",
		domainId: "frontend",
		skills: ["SCSS", "CSS", "SASS", "SCSS Modules", "Emotion", "HTML"],
	},
	{
		id: "fe-build",
		label: "Build & Rendering",
		labelZh: "建置與渲染",
		domainId: "frontend",
		skills: ["Vite", "SSR", "PWA", "Static Export"],
	},
	{
		id: "fe-forms",
		label: "Forms & Tables",
		labelZh: "表單與表格",
		domainId: "frontend",
		skills: ["react-hook-form", "Formik", "react-table"],
	},
	{
		id: "fe-data",
		label: "Data & GraphQL",
		labelZh: "資料與 GraphQL",
		domainId: "frontend",
		skills: ["Apollo"],
	},
	{
		id: "fe-i18n",
		label: "i18n & Routing",
		labelZh: "國際化與路由",
		domainId: "frontend",
		skills: [
			"i18n",
			"next-intl",
			"vue-i18n",
			"react-router-dom",
			"Vue",
			"Vue Router",
		],
	},
	{
		id: "fe-3d",
		label: "3D & Visualization",
		labelZh: "3D 與視覺化",
		domainId: "frontend",
		skills: ["React Three Fiber", "Chart.js", "ECharts"],
	},

	// ── Backend ──
	{
		id: "be-fw",
		label: "Frameworks",
		labelZh: "框架",
		domainId: "backend",
		skills: [
			"NestJS",
			"ASP.NET Core",
			"ASP.NET Core 6",
			".NET 5",
			".NET 6",
			".NET 8",
			"Laravel",
			"Laravel 8",
			"Laravel 10",
			"Django",
			"Django REST Framework",
			"Express",
			"Node.js",
			"Node.js 18",
			"Spring Boot",
			"Spring MVC",
			"GatewayWorker",
			"WCF",
		],
	},
	{
		id: "be-auth",
		label: "Auth",
		labelZh: "身份驗證",
		domainId: "backend",
		skills: [
			"JWT",
			"NextAuth",
			"OAuth2",
			"OAuth",
			"CAS SSO",
			"CAS",
			"CASL",
			"OIDC",
			"Azure AD",
			"LINE Login",
			"Auth.js",
			"LDAP",
			"HMAC",
		],
	},
	{
		id: "be-api",
		label: "API",
		labelZh: "API",
		domainId: "backend",
		skills: [
			"REST API",
			"GraphQL",
			"OpenAPI",
			"Swagger",
			"WebSocket",
			"Socket.IO",
		],
	},
	{
		id: "be-queue",
		label: "Queue & Jobs",
		labelZh: "佇列與排程",
		domainId: "backend",
		skills: ["BullMQ", "Quartz.NET", "node-cron", "Queue"],
	},
	{
		id: "be-pattern",
		label: "Logging & Patterns",
		labelZh: "日誌與架構模式",
		domainId: "backend",
		skills: ["NLog", "Repository Pattern"],
	},

	// ── Cloud ──
	{
		id: "cl-firebase",
		label: "Firebase",
		labelZh: "Firebase",
		domainId: "cloud",
		skills: [
			"Firebase",
			"Firebase Admin",
			"Firestore",
			"Firebase FCM",
			"Firebase Hosting",
		],
	},
	{
		id: "cl-azure",
		label: "Azure",
		labelZh: "Azure",
		domainId: "cloud",
		skills: ["Azure AD", "Azure OpenAI", "Azure Functions"],
	},
	{
		id: "cl-gcp",
		label: "Google Cloud",
		labelZh: "GCP",
		domainId: "cloud",
		skills: [
			"Google Cloud Storage",
			"Google Maps",
			"Google Sign-In",
			"Gmail API",
			"Google Maps Geocoding API",
			"Google Sheets API",
		],
	},
	{
		id: "cl-other",
		label: "Self-Hosted / CDN",
		labelZh: "自架服務",
		domainId: "cloud",
		skills: ["Serverless", "Self-Hosted", "Mapbox"],
	},

	// ── Database ──
	{
		id: "db-rdb",
		label: "Relational",
		labelZh: "關聯式",
		domainId: "database",
		skills: [
			"PostgreSQL",
			"MySQL",
			"SQL Server",
			"Oracle",
			"OCI8",
			"SQLite",
			"MariaDB",
			"CloudNativePG",
			"Replica Set",
		],
	},
	{
		id: "db-nosql",
		label: "NoSQL",
		labelZh: "NoSQL",
		domainId: "database",
		skills: ["MongoDB", "Redis", "Elasticsearch", "Memcached", "Room"],
	},
	{
		id: "db-orm",
		label: "ORM",
		labelZh: "ORM",
		domainId: "database",
		skills: ["Prisma", "Entity Framework Core"],
	},
	{
		id: "db-vector",
		label: "Vector",
		labelZh: "向量資料庫",
		domainId: "database",
		skills: ["pgvector", "Weaviate", "Vector Database"],
	},

	// ── DevOps ──
	{
		id: "do-container",
		label: "Container",
		labelZh: "容器",
		domainId: "devops",
		skills: [
			"Docker",
			"Docker Compose",
			"Docker Swarm",
			"Kubernetes",
			"k3s",
			"Longhorn",
			"kube-vip",
			"kubectl",
			"etcd",
			"Helm",
			"Helm-style Templates",
			"High Availability",
			"Multi-arch",
		],
	},
	{
		id: "do-web",
		label: "Web Server",
		labelZh: "Web Server",
		domainId: "devops",
		skills: [
			"Nginx",
			"Apache",
			"Tomcat",
			"uWSGI",
			"Nginx Ingress",
			"Nginx Proxy Manager",
			"Reverse Proxy",
			"SSL",
			"Let's Encrypt",
		],
	},
	{
		id: "do-cicd",
		label: "CI / CD",
		labelZh: "CI/CD",
		domainId: "devops",
		skills: ["Jenkins", "GitLab CI", "GitHub Actions", "CI/CD"],
	},
	{
		id: "do-obs",
		label: "Observability",
		labelZh: "監控",
		domainId: "devops",
		skills: ["PM2", "Prometheus", "Sentry", "EFK", "Grafana"],
	},
	{
		id: "do-tooling",
		label: "Build & Package Tools",
		labelZh: "建置與套件工具",
		domainId: "devops",
		skills: [
			"Maven",
			"NVM",
			"Yarn",
			"pnpm",
			"Composer",
			"NuGet",
			"SFTP",
			"Ofelia",
			"XDebug",
		],
	},

	// ── AI / LLM ──
	{
		id: "ai-fw",
		label: "Frameworks",
		labelZh: "框架",
		domainId: "ai_llm",
		skills: ["LangChain", "LangGraph", "AI SDK"],
	},
	{
		id: "ai-model",
		label: "Models",
		labelZh: "模型",
		domainId: "ai_llm",
		skills: ["OpenAI", "Azure OpenAI"],
	},
	{
		id: "ai-vector",
		label: "Vector Store",
		labelZh: "向量庫",
		domainId: "ai_llm",
		skills: ["Weaviate", "pgvector"],
	},
	{
		id: "ai-tools",
		label: "Tools",
		labelZh: "工具",
		domainId: "ai_llm",
		skills: [
			"MCP",
			"LangFuse",
			"Claude Code",
			"Claude Code Plugin",
			"Claude Code Skills",
			"Agent Skills",
			"AI Coding Agent Tooling",
		],
	},

	// ── Mobile ──
	{
		id: "mob-android",
		label: "Android",
		labelZh: "Android",
		domainId: "mobile",
		skills: [
			"Android",
			"Kotlin",
			"React Native",
			"Gradle",
			"MVVM",
			"MVC",
			"Retrofit",
			"Koin",
			"LiveData",
			"RecyclerView",
			"OkHttp",
			"Picasso",
			"Health Connect",
			"Navigation Component",
			"ViewBinding",
			"Volley",
			"Google Play",
			"FCM",
			"Material Design",
		],
	},
	{
		id: "mob-ios",
		label: "iOS",
		labelZh: "iOS",
		domainId: "mobile",
		skills: [
			"iOS",
			"Swift",
			"Swift 6",
			"Swift Concurrency",
			"Objective-C",
			"Flutter",
			"SwiftUI",
			"UIKit",
			"Alamofire",
			"CocoaPods",
			"RxSwift",
			"Combine",
			"CoreBluetooth",
			"CoreData",
			"CoreLocation",
			"HealthKit",
			"APNs",
			"Core Graphics",
			"DGCharts",
			"FSCalendar",
			"GRDB",
			"Lottie",
			"MapKit",
			"Realm",
			"RealmSwift",
			"SwiftyJSON",
			"TestFlight",
			"WidgetKit",
		],
	},
	{
		id: "mob-conn",
		label: "Connectivity",
		labelZh: "連線",
		domainId: "mobile",
		skills: [
			"BLE",
			"MQTT",
			"Push Notification",
			"Bluetooth BLE",
			"Deep Link",
			"QR Code",
			"WebView",
			"React Native WebView",
			"Foreground Service",
		],
	},
	{
		id: "mob-cross",
		label: "Cross-Platform & Payments",
		labelZh: "跨平台與金流",
		domainId: "mobile",
		skills: ["Expo", "Expo Router", "ECPay", "Manifest V3"],
	},

	// ── Tools ──
	{
		id: "tl-test",
		label: "Testing",
		labelZh: "測試",
		domainId: "tools",
		skills: ["Playwright", "Jest", "PHPUnit"],
	},
	{
		id: "tl-auto",
		label: "Automation",
		labelZh: "自動化",
		domainId: "tools",
		skills: ["n8n", "Automation", "Fastlane", "node-cron"],
	},
	{
		id: "tl-dev",
		label: "Dev Tools",
		labelZh: "開發工具",
		domainId: "tools",
		skills: [
			"CLI",
			"Chrome Extension",
			"SonarQube",
			"ESLint",
			"GitLab",
			"Bash",
			"Shell",
			"Shell Script",
			"Tauri",
			"Vike",
			"vite-plugin-ssr",
			"macOS",
			"Rust",
			"PHP 8.1",
			"React 19",
			"phpMyAdmin",
		],
	},
	{
		id: "tl-http",
		label: "HTTP & Networking",
		labelZh: "HTTP 與網路",
		domainId: "tools",
		skills: [
			"Axios",
			"HTTP POST",
			"SMTP",
			"WebRTC",
			"qs",
			"Web Scraping",
			"Browser Automation",
		],
	},
	{
		id: "tl-data",
		label: "Data & Document Processing",
		labelZh: "資料與文件處理",
		domainId: "tools",
		skills: [
			"Markdown",
			"docx",
			"dotenv",
			"iconv-lite",
			"jspreadsheet",
			"jsuites",
			"lodash",
			"moment",
			"pandas",
			"pdf-parse",
			"pdf2json",
			"PDF Parsing",
			"Syncfusion DocIO",
			"Word Document Generation",
			"Big5",
		],
	},
	{
		id: "tl-collab",
		label: "Analytics & Collaboration",
		labelZh: "分析與協作",
		domainId: "tools",
		skills: ["Matomo", "Web Analytics", "Microsoft Teams", "Trello"],
	},

	// ── Other ──
	{
		id: "other-misc",
		label: "Miscellaneous",
		labelZh: "其他",
		domainId: "other",
		skills: ["Thymeleaf", "RWD"],
	},
];

// Languages domain is flat (no categories); these skills map directly domain → leaf
export const languageSkills = [
	"TypeScript",
	"JavaScript",
	"C#",
	"PHP",
	"Java",
	"Python",
	"Ruby",
	"Dart",
	"Groovy",
];

export const graphLayoutConfig: GraphLayoutConfig = {
	initialCameraZ: 500,
	cameraFlyDuration: 800,
	focusDistance: 100,
};

const DOMAIN_BADGE: Record<string, string> = {
	frontend: "FE",
	backend: "BE",
	ai_llm: "AI",
	database: "DB",
	devops: "OPS",
	cloud: "CLD",
	mobile: "MOB",
	tools: "TL",
	languages: "LNG",
	other: "OTH",
};

export function domainBadge(domainId: string): string {
	return DOMAIN_BADGE[domainId] ?? domainId.slice(0, 3).toUpperCase();
}
