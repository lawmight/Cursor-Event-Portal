export const siteConfig = {
  communityName: "Cursor",
  communityNameLocal: "Shanghai",
  city: "Shanghai",
  country: "China",
  brandImagePath: "/cursor_china_photo/cursor-SHANGHAI-CHINA.png",
  lumaUrl: "https://lu.ma/cursor-china",
  cursorCommunityUrl: "https://cursor.com/community",
  defaultLocale: "en",
  locales: ["en"],
  footerTagline: "Built with Cursor in Shanghai",
  defaultTimezone: "Asia/Shanghai",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://cursor-event-portal.onrender.com",
  venueAddressPlaceholder: "Address TBA (Shanghai, China)",
  defaultActiveEventSlug: "shanghai-march-2026",
  easterEggEventSlug: "shanghai-march-2026" as string | null,
} as const;

export type SiteConfig = typeof siteConfig;

export function communityDisplayName() {
  return `${siteConfig.communityName} ${siteConfig.communityNameLocal}`.trim();
}

export function communityFullTitle() {
  return `${communityDisplayName()} - Community Meetups`;
}

export function communityDescription() {
  return `${siteConfig.city}'s ${siteConfig.communityName} community. Join us for hands-on AI-powered development meetups, workshops, and demos.`;
}

export function communityPortalName() {
  return `${communityDisplayName()} Portal`;
}

export function communityOrganizersName() {
  return `${communityDisplayName()} community organizers`;
}

export function isEasterEggEventSlug(slug: string | null | undefined) {
  return !!siteConfig.easterEggEventSlug && slug === siteConfig.easterEggEventSlug;
}
