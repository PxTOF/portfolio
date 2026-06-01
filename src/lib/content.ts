import {
  BadgeCheck,
  Camera,
  Clapperboard,
  Layers,
  Megaphone,
  PenTool,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

export type ProjectStatus = "Done" | "In Build" | "Active" | "Early Stage";

export type Project = {
  id: string;
  index: string;
  title: string;
  category: string;
  status: ProjectStatus;
  headline: string;
  description: string;
  outcomeLabel: string;
  outcome: string;
  logo: string;
  video?: string;
  gallery?: string[];
  mediaNote: string;
  tags: string[];
  accent: string;
};

export const brand = {
  name: "SNAG",
  logo: "/assets/logos/snag.svg",
  email: "teamstudiosnag@gmail.com",
  instagram: "@studio.snag",
  phone: "+91 97293 17565",
  location: "Pyramid Altia, Sector 70, Gurgaon",
};

export const projects: Project[] = [
  {
    id: "superprofile-cosmofeed",
    index: "01",
    title: "SuperProfile x CosmoFeed",
    category: "Influencer engine",
    status: "Done",
    headline: "500+ creators. One system. No noise.",
    description:
      "Built the onboarding and activation engine for a high-volume paid creator network. The job was not more creators. It was cleaner movement.",
    outcomeLabel: "Outcome",
    outcome: "Mass adoption and sustained creator velocity across the platform.",
    logo: "/assets/logos/superprofile.png",
    gallery: ["/assets/logos/superprofile.png"],
    mediaNote: "Brand asset loaded. The SuperProfile reel was not in the brand-named work folder yet.",
    tags: ["creator ops", "influence", "systems"],
    accent: "#6ee7f9",
  },
  {
    id: "burger-bae",
    index: "02",
    title: "Burger Bae",
    category: "Social + growth",
    status: "Done",
    headline: "From 30K a day to 3L a day. No gimmicks.",
    description:
      "Handled social and growth execution around content that could convert, not just look good. Then pushed a 360+ creator barter campaign into distribution.",
    outcomeLabel: "Outcome",
    outcome: "10x revenue scale and one of the brand's strongest creator-led growth phases.",
    logo: "/assets/logos/burger-bae.png",
    video: "/assets/media/burger-bae.mp4",
    mediaNote: "Playable Burger Bae reel from the brand-named work folder.",
    tags: ["growth", "food", "creator campaign"],
    accent: "#ffb000",
  },
  {
    id: "baecave-radisson",
    index: "03",
    title: "Baecave x Burger Bae x Radisson",
    category: "Creator experience",
    status: "Done",
    headline: "Not an event. A content ecosystem.",
    description:
      "Curated a closed-room creator experience with 30-40 creators inside a Radisson property. Every touchpoint was built to be captured, posted, and circulated.",
    outcomeLabel: "Outcome",
    outcome: "High-volume organic content with strong local brand recall.",
    logo: "/assets/logos/radisson-red.png",
    video: "/assets/media/red-radisson.mp4",
    mediaNote: "Playable Radisson event reel from the brand-named work folder.",
    tags: ["events", "UGC", "experience"],
    accent: "#e8271e",
  },
  {
    id: "my-artist",
    index: "04",
    title: "My Artist",
    category: "Brand identity",
    status: "In Build",
    headline: "Built to be a brand, not a product page.",
    description:
      "Defining the identity, launch language, and visual system from zero for a culture-led beauty brand that should not feel like another nail store.",
    outcomeLabel: "Status",
    outcome: "In build phase, designed for scale instead of short-term hype.",
    logo: brand.logo,
    video: "/assets/media/my-artist.mp4",
    gallery: [
      "/assets/gallery/my-artist/heer.png",
      "/assets/gallery/my-artist/noor.png",
      "/assets/gallery/my-artist/haseen-dilruba.png",
    ],
    mediaNote: "Playable My Artist reel plus product visuals pulled from the My Artist folders.",
    tags: ["identity", "beauty", "launch"],
    accent: "#f7e7d4",
  },
  {
    id: "depano",
    index: "05",
    title: "Depano",
    category: "Positioning + digital",
    status: "Active",
    headline: "Not starting from zero. Fixing what was stuck.",
    description:
      "Reworking a fashion brand with no real traction into a sharper digital presence: content direction, positioning, and conversion intent.",
    outcomeLabel: "Focus",
    outcome: "Turning visibility into actual website sales, not just engagement.",
    logo: "/assets/logos/depano.png",
    video: "/assets/media/depano.mov",
    gallery: [
      "/assets/gallery/depano/banner-8.png",
      "/assets/gallery/depano/banner-14.png",
      "/assets/gallery/depano/post-8.png",
    ],
    mediaNote: "Playable Depano reel plus campaign creatives from the brand-named folders.",
    tags: ["fashion", "positioning", "sales"],
    accent: "#7dd3fc",
  },
  {
    id: "beauty-marketplace",
    index: "06",
    title: "Multi-Category Beauty Marketplace",
    category: "Marketplace + brand",
    status: "Early Stage",
    headline: "Early stage. High trust. Built for repeat behavior.",
    description:
      "Building a sharper beauty and grooming ecosystem where service, discovery, and brand recall work like one system.",
    outcomeLabel: "Role",
    outcome: "End-to-end brand and marketplace ownership.",
    logo: "/assets/logos/beauty-marketplace.svg",
    video: "/assets/media/beauty-marketplace.mp4",
    mediaNote: "Playable marketplace reel from the brand-named work folder.",
    tags: ["marketplace", "grooming", "brand"],
    accent: "#c084fc",
  },
];

export const services = [
  {
    title: "Social Media Management",
    text: "Content systems for reach, consistency, and conversion.",
    icon: Users,
  },
  {
    title: "Influencer Marketing",
    text: "Creator networks structured to create movement, not vanity reach.",
    icon: Sparkles,
  },
  {
    title: "Branding & Creative",
    text: "Positioning, identity, and campaigns with a reason to exist.",
    icon: PenTool,
  },
  {
    title: "Production & Shoots",
    text: "Content-first production built for real usage and fast output.",
    icon: Camera,
  },
  {
    title: "Campaigns & Launches",
    text: "High-impact moments designed to drive attention and momentum.",
    icon: Megaphone,
  },
  {
    title: "Content Systems",
    text: "Repeatable formats that turn scattered posting into brand memory.",
    icon: Layers,
  },
  {
    title: "Design & Editing",
    text: "Platform-ready visuals, reels, and edits with a point of view.",
    icon: Clapperboard,
  },
  {
    title: "Strategy & Ads",
    text: "Sharper decisions across websites, SEO, ads, and scripting.",
    icon: Target,
  },
  {
    title: "Bottom Line",
    text: "We build systems that scale attention.",
    icon: BadgeCheck,
  },
];
