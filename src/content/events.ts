import { CursorEvent } from '@/lib/landing-types';

export const events: CursorEvent[] = [
  {
    id: 'calgary-apr-2026',
    title: 'Cursor Meetup Calgary April',
    date: '2026-04-29',
    displayDate: 'April 29, 2026',
    location: 'Calgary, Canada',
    lumaUrl: 'https://lu.ma/onlcm9o9',
    status: 'upcoming',
  },
  {
    id: 'calgary-hackathon-mar-2026',
    title: 'Cursor Hackathon UCalgary',
    date: '2026-03-14',
    displayDate: 'March 14–15, 2026',
    attendees: 72,
    location: 'Calgary, Canada',
    thumbnail: '/cursor_china_photo/china-10.png',
    galleryImages: ['/cursor_china_photo/china-13.png', '/cursor_china_photo/china-08.png'],
    status: 'past',
  },
  {
    id: 'calgary-coworking-mar-2026',
    title: 'Cursor Coworking Calgary',
    date: '2026-03-11',
    displayDate: 'March 11, 2026',
    location: 'Calgary, Canada',
    thumbnail: '/cursor_china_photo/china-04.jpg',
    galleryImages: ['/cursor_china_photo/china-05.png', '/cursor_china_photo/china-14.png'],
    status: 'past',
  },
  {
    id: 'calgary-feb-2026',
    title: 'Cursor Calgary Meetup',
    date: '2026-02-25',
    displayDate: 'February 25, 2026',
    attendees: 40,
    location: 'Calgary, Canada',
    thumbnail: '/cursor_china_photo/china-07.png',
    galleryImages: ['/cursor_china_photo/china-09.png', '/cursor_china_photo/china-01.jpg'],
    status: 'past',
  },
];

export const upcomingEvents = events.filter((e) => e.status === 'upcoming');
export const pastEvents = events.filter((e) => e.status === 'past');
