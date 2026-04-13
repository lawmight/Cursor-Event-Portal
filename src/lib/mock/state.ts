import type { CompetitionEntry, CompetitionWithEntries, EventPhoto, PhotoStatus } from "@/types";
import {
  MOCK_COMPETITIONS,
  MOCK_EVENT_PHOTOS,
  MOCK_HERO_FEATURED_PHOTO_IDS,
} from "./data";

type MockState = {
  competitions: CompetitionWithEntries[];
  eventPhotos: EventPhoto[];
  heroFeaturedPhotoIds: string[];
};

type GlobalMockState = typeof globalThis & {
  __cursorMockState?: MockState;
};

function buildInitialState(): MockState {
  return {
    competitions: structuredClone(MOCK_COMPETITIONS),
    eventPhotos: structuredClone(MOCK_EVENT_PHOTOS),
    heroFeaturedPhotoIds: [...MOCK_HERO_FEATURED_PHOTO_IDS],
  };
}

function getState(): MockState {
  const globalState = globalThis as GlobalMockState;
  if (!globalState.__cursorMockState) {
    globalState.__cursorMockState = buildInitialState();
  }
  return globalState.__cursorMockState;
}

export function getMockCompetitionsState(): CompetitionWithEntries[] {
  return getState().competitions;
}

export function getMockEventPhotosState(): EventPhoto[] {
  return getState().eventPhotos;
}

export function getMockHeroFeaturedPhotoIdsState(): string[] {
  return getState().heroFeaturedPhotoIds;
}

export function addMockEventPhoto(
  photo: Omit<EventPhoto, "id" | "created_at">
): EventPhoto {
  const nextPhoto: EventPhoto = {
    ...photo,
    id: `mock-photo-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  const state = getState();
  state.eventPhotos = [nextPhoto, ...state.eventPhotos];
  return nextPhoto;
}

export function updateMockEventPhotoStatus(photoId: string, status: PhotoStatus) {
  const state = getState();
  state.eventPhotos = state.eventPhotos.map((photo) =>
    photo.id === photoId
      ? {
          ...photo,
          status,
          reviewed_at: new Date().toISOString(),
        }
      : photo
  );
}

export function removeMockEventPhoto(photoId: string) {
  const state = getState();
  state.eventPhotos = state.eventPhotos.filter((photo) => photo.id !== photoId);
  state.heroFeaturedPhotoIds = state.heroFeaturedPhotoIds.filter((id) => id !== photoId);
}

export function bulkApproveMockEventPhotos(photoIds: string[]) {
  const ids = new Set(photoIds);
  const state = getState();
  state.eventPhotos = state.eventPhotos.map((photo) =>
    ids.has(photo.id)
      ? {
          ...photo,
          status: "approved",
          reviewed_at: new Date().toISOString(),
        }
      : photo
  );
}

export function setMockHeroFeaturedPhotoIds(ids: string[]) {
  getState().heroFeaturedPhotoIds = [...ids];
}

function findMockCompetitionEntryInternal(entryId: string): CompetitionEntry | null {
  return (
    getState()
      .competitions
      .flatMap((competition) => competition.entries ?? [])
      .find((entry) => entry.id === entryId) ?? null
  );
}

export function findMockCompetitionEntry(entryId: string): CompetitionEntry | null {
  return findMockCompetitionEntryInternal(entryId);
}

export function updateMockCompetitionEntry(
  entryId: string,
  data: Partial<Pick<CompetitionEntry, "title" | "description" | "repo_url" | "project_url" | "preview_image_url" | "video_url">>
) {
  const entry = findMockCompetitionEntryInternal(entryId);
  if (!entry) return null;

  Object.assign(entry, data);
  return entry;
}

export function removeMockCompetitionEntryMedia(
  entryId: string,
  mediaType: "preview_image" | "video"
) {
  const entry = findMockCompetitionEntryInternal(entryId);
  if (!entry) return null;

  if (mediaType === "preview_image") {
    entry.preview_image_url = null;
  } else {
    entry.video_url = null;
  }

  return entry;
}

export function deleteMockCompetitionEntry(entryId: string) {
  const state = getState();

  state.competitions = state.competitions.map((competition) => {
    const nextEntries = (competition.entries ?? []).filter((entry) => entry.id !== entryId);
    const winnerCleared =
      competition.winner_entry_id === entryId ? null : competition.winner_entry_id;
    const groupWinnerCleared =
      competition.group_winner_entry_id === entryId ? null : competition.group_winner_entry_id;
    const adminWinnerCleared =
      competition.admin_winner_entry_id === entryId ? null : competition.admin_winner_entry_id;
    const top3Cleared = (competition.top3_entry_ids ?? []).filter((id) => id !== entryId);

    return {
      ...competition,
      entries: nextEntries,
      winner_entry_id: winnerCleared,
      group_winner_entry_id: groupWinnerCleared,
      admin_winner_entry_id: adminWinnerCleared,
      top3_entry_ids: top3Cleared.length ? top3Cleared : null,
      winner_entry:
        competition.winner_entry?.id === entryId ? null : competition.winner_entry ?? null,
      group_winner_entry:
        competition.group_winner_entry?.id === entryId
          ? null
          : competition.group_winner_entry ?? null,
      admin_winner_entry:
        competition.admin_winner_entry?.id === entryId
          ? null
          : competition.admin_winner_entry ?? null,
    };
  });
}
