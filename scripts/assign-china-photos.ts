/**
 * One-off: copy originals in public/cursor_china_photo/ to china-01.* … china-14.*,
 * read dimensions with sharp, then greedy-assign to hero + past-only slots.
 * Run: npx tsx scripts/assign-china-photos.ts
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'public', 'cursor_china_photo');
const PREFIX = '/cursor_china_photo';

const IMAGE_RE = /\.(jpe?g|png|webp|avif)$/i;

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const rnd = mulberry32(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Photo = { publicPath: string; basename: string; aspect: number };

function scoreAspect(aspect: number, target: number): number {
  const la = Math.log(aspect);
  const lt = Math.log(target);
  return (la - lt) ** 2;
}

const heroSlots: { id: string; target: number }[] = [
  { id: 'venue-wide', target: 1.0 },
  { id: 'winners-1st', target: 1.0 },
  { id: 'hacking', target: 0.62 },
  { id: 'demos', target: 1.0 },
  { id: 'feb-vr', target: 0.62 },
  { id: 'crowd', target: 1.0 },
  { id: 'coworking-venue', target: 0.62 },
];

const pastOnlySlots: { id: string; target: number }[] = [
  { id: 'winners-3rd', target: 1.85 },
  { id: 'coworking-whiteboard', target: 1.85 },
  { id: 'coworking-group', target: 1.85 },
  { id: 'feb-meetup-group', target: 1.85 },
  { id: 'feb-meetup-coding', target: 1.85 },
];

function greedyPick(
  orderedPool: Photo[],
  target: number,
  used: Set<string>
): Photo | undefined {
  let best: Photo | undefined;
  let bestScore = Infinity;
  for (const p of orderedPool) {
    if (used.has(p.basename)) continue;
    const s = scoreAspect(p.aspect, target);
    if (s < bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return best;
}

async function ensureStableNames(): Promise<string[]> {
  const entries = fs.readdirSync(DIR);
  const china = entries.filter((f) => /^china-\d{2}\./i.test(f)).sort();
  if (china.length === 14) {
    return china;
  }

  const originals = entries.filter((f) => !/^china-\d{2}\./i.test(f) && IMAGE_RE.test(f)).sort();
  if (originals.length !== 14) {
    throw new Error(
      `Expected 14 originals or 14 china-NN files; got originals=${originals.length}, china=${china.length}`
    );
  }

  for (let i = 0; i < originals.length; i++) {
    const ext = path.extname(originals[i]);
    const destName = `china-${String(i + 1).padStart(2, '0')}${ext}`;
    const src = path.join(DIR, originals[i]);
    const dest = path.join(DIR, destName);
    fs.copyFileSync(src, dest);
  }
  for (const f of originals) {
    fs.unlinkSync(path.join(DIR, f));
  }

  return fs
    .readdirSync(DIR)
    .filter((f) => /^china-\d{2}\./i.test(f))
    .sort();
}

async function loadPhotos(basenames: string[]): Promise<Photo[]> {
  const out: Photo[] = [];
  for (const basename of basenames) {
    const full = path.join(DIR, basename);
    const meta = await sharp(full).metadata();
    const w = meta.width ?? 1;
    const h = meta.height ?? 1;
    out.push({
      basename,
      publicPath: `${PREFIX}/${basename}`,
      aspect: w / h,
    });
  }
  return out;
}

async function main() {
  const names = await ensureStableNames();
  const pool = shuffle(await loadPhotos(names), 42);
  const used = new Set<string>();
  const hero: Record<string, string> = {};

  for (const slot of heroSlots) {
    const picked = greedyPick(pool, slot.target, used);
    if (!picked) throw new Error(`No photo for hero ${slot.id}`);
    used.add(picked.basename);
    hero[slot.id] = picked.publicPath;
  }

  const pastOnly: Record<string, string> = {};
  for (const slot of pastOnlySlots) {
    const picked = greedyPick(pool, slot.target, used);
    if (!picked) throw new Error(`No photo for past ${slot.id}`);
    used.add(picked.basename);
    pastOnly[slot.id] = picked.publicPath;
  }

  const leftover = pool.filter((p) => !used.has(p.basename));
  if (leftover.length !== 2) {
    console.warn(`Expected 2 leftover photos, got ${leftover.length}`);
  }

  console.log(JSON.stringify({ hero, pastOnly, leftover: leftover.map((p) => p.publicPath) }, null, 2));

  const headerPath = path.join(ROOT, 'src', 'content', 'header-photos.ts');
  const headerContent = `import { HeaderPhoto } from '@/lib/landing-types';

export const headerPhotos: HeaderPhoto[] = [
  {
    src: '${hero['venue-wide']}',
    alt: 'Cursor community hackathon — wide venue shot',
    row: 1,
    col: 1,
    rowSpan: 2,
    colSpan: 2,
    mobile: { row: 1, col: 1, rowSpan: 2, colSpan: 2 },
  },
  {
    src: '${hero['winners-1st']}',
    alt: 'First place winners — Cursor community hackathon',
    row: 1,
    col: 3,
    mobile: { row: 3, col: 1 },
  },
  {
    src: '${hero['hacking']}',
    alt: 'Teams building together at Cursor community hackathon',
    row: 1,
    col: 4,
    rowSpan: 2,
    mobileHidden: true,
  },
  {
    src: '${hero['demos']}',
    alt: 'Demo presentations — Cursor community hackathon',
    row: 2,
    col: 3,
    mobile: { row: 3, col: 2 },
  },
  {
    src: '${hero['feb-vr']}',
    alt: 'Hands-on demo at Cursor community meetup',
    row: 3,
    col: 1,
    rowSpan: 2,
    mobileHidden: true,
  },
  {
    src: '${hero['crowd']}',
    alt: 'Community crowd — Cursor hackathon',
    row: 3,
    col: 2,
    rowSpan: 2,
    colSpan: 2,
    mobileHidden: true,
  },
  {
    src: '${hero['coworking-venue']}',
    alt: 'Cursor community coworking space',
    row: 3,
    col: 4,
    rowSpan: 2,
    mobile: { row: 4, col: 1, colSpan: 2 },
  },
];
`;
  fs.writeFileSync(headerPath, headerContent, 'utf8');

  const eventsPath = path.join(ROOT, 'src', 'content', 'events.ts');
  const eventsContent = `import { CursorEvent } from '@/lib/landing-types';

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
    thumbnail: '${hero['venue-wide']}',
    galleryImages: ['${hero['winners-1st']}', '${pastOnly['winners-3rd']}'],
    status: 'past',
  },
  {
    id: 'calgary-coworking-mar-2026',
    title: 'Cursor Coworking Calgary',
    date: '2026-03-11',
    displayDate: 'March 11, 2026',
    location: 'Calgary, Canada',
    thumbnail: '${hero['coworking-venue']}',
    galleryImages: ['${pastOnly['coworking-whiteboard']}', '${pastOnly['coworking-group']}'],
    status: 'past',
  },
  {
    id: 'calgary-feb-2026',
    title: 'Cursor Calgary Meetup',
    date: '2026-02-25',
    displayDate: 'February 25, 2026',
    attendees: 40,
    location: 'Calgary, Canada',
    thumbnail: '${pastOnly['feb-meetup-group']}',
    galleryImages: ['${hero['feb-vr']}', '${pastOnly['feb-meetup-coding']}'],
    status: 'past',
  },
];

export const upcomingEvents = events.filter((e) => e.status === 'upcoming');
export const pastEvents = events.filter((e) => e.status === 'past');
`;
  fs.writeFileSync(eventsPath, eventsContent, 'utf8');

  const [w1, w2] = leftover.length >= 2 ? [leftover[0]!, leftover[1]!] : [leftover[0], leftover[0]].filter(Boolean) as Photo[];
  const worldPath = path.join(ROOT, 'src', 'content', 'world-events.ts');
  const worldContent = `import { WorldEventPhoto } from '@/lib/landing-types';

export const worldEventPhotos: WorldEventPhoto[] = [
  {
    src: '${w1?.publicPath ?? ''}',
    location: 'Cursor community — China',
    date: '2025',
    alt: 'Cursor community gathering in China',
  },
  {
    src: '${w2?.publicPath ?? ''}',
    location: 'Cursor community — China',
    date: '2025',
    alt: 'Cursor community event in China',
  },
];
`;
  if (w1 && w2) {
    fs.writeFileSync(worldPath, worldContent, 'utf8');
  }

  const popupPath = path.join(ROOT, 'src', 'components', 'landing', 'EventPortalPopup.tsx');
  let popup = fs.readFileSync(popupPath, 'utf8');
  const popupSrc = w1?.publicPath ?? hero['venue-wide'];
  popup = popup.replace(
    /src="\/cursor-calgary\.avif"/,
    `src="${popupSrc}"`
  );
  popup = popup.replace(/alt="Cursor Calgary"/, 'alt="Cursor community"');
  fs.writeFileSync(popupPath, popup, 'utf8');

  console.log('Wrote header-photos.ts, events.ts, world-events.ts, EventPortalPopup.tsx');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
