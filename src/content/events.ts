import { CursorEvent } from "@/lib/landing-types";

export const events: CursorEvent[] = [
  {
    id: "shanghai-apr-2026",
    title: "Cursor Shanghai April Meetup",
    date: "2026-04-29",
    displayDate: "April 29, 2026",
    location: "Shanghai, China",
    lumaUrl: "https://lu.ma/cursor-china",
    status: "upcoming",
  },
  {
    id: "shanghai-hackathon-mar-2026",
    title: "Cursor Shanghai Builders Weekend",
    date: "2026-03-14",
    displayDate: "March 14–15, 2026",
    attendees: 72,
    location: "Shanghai, China",
    thumbnail: "/cursor_china_photo/china-10.png",
    galleryImages: ["/cursor_china_photo/china-13.png", "/cursor_china_photo/china-08.png"],
    status: "past",
  },
  {
    id: "shanghai-coworking-mar-2026",
    title: "Cursor Shanghai Coworking Session",
    date: "2026-03-11",
    displayDate: "March 11, 2026",
    location: "Shanghai, China",
    thumbnail: "/cursor_china_photo/china-04.jpg",
    galleryImages: ["/cursor_china_photo/china-05.png", "/cursor_china_photo/china-14.png"],
    status: "past",
  },
  {
    id: "shanghai-march-2026",
    title: "Cursor Shanghai Community Meetup",
    date: "2026-03-25",
    displayDate: "March 25, 2026",
    attendees: 40,
    location: "Shanghai, China",
    thumbnail: "/cursor_china_photo/china-07.png",
    galleryImages: ["/cursor_china_photo/china-09.png", "/cursor_china_photo/china-01.jpg"],
    status: "past",
  },
];

export const upcomingEvents = events.filter((e) => e.status === "upcoming");
export const pastEvents = events.filter((e) => e.status === "past");
