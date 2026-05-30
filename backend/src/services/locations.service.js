import prisma from '../database/client.js';
import { AppError } from '../utils/AppError.js';
import { enrichPostsWithMedia } from './media.service.js';

const PLACEHOLDER_HOSTS = ['placehold.co', 'via.placeholder.com'];

export function isPlaceholderMediaUrl(url) {
  if (!url || typeof url !== 'string') return true;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return PLACEHOLDER_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return true;
  }
}

/**
 * List active locations with business details for dashboard.
 */
export async function listAllLocations() {
  const locations = await prisma.location.findMany({
    where: { status: 'ACTIVE' },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          ghlAccountId: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return locations.map((loc) => ({
    id: loc.id,
    businessId: loc.businessId,
    businessName: loc.business.name,
    ghlLocationId: loc.ghlLocationId,
    requiresApproval: loc.requiresApproval,
    ghlLastPostDateFieldId: loc.ghlLastPostDateFieldId,
    ghlPostStatusFieldId: loc.ghlPostStatusFieldId,
    status: loc.status,
    timezone: loc.timezone,
  }));
}

/**
 * Pending posts across all locations for approval queue.
 */
export async function listPendingPosts() {
  const posts = await prisma.post.findMany({
    where: { status: 'PENDING' },
    include: {
      location: {
        include: {
          business: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const enriched = await enrichPostsWithMedia(posts);

  return enriched.map(({ location, ...post }) => ({
    ...post,
    locationName: location.business.name,
    ghlLocationId: location.ghlLocationId,
  }));
}

export async function getLocationOrThrow(locationId) {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: {
      business: { select: { id: true, name: true, ghlAccountId: true } },
    },
  });
  if (!location) {
    throw new AppError('Location not found.', 404, { code: 'LOCATION_NOT_FOUND' });
  }
  return location;
}

function isToday(date) {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Overview cards: locations with latest post stats.
 */
export async function listLocationSummaries() {
  const locations = await listAllLocations();

  return Promise.all(
    locations.map(async (loc) => {
      const [lastPostRaw, totalPosts, pendingCount] = await Promise.all([
        prisma.post.findFirst({
          where: { locationId: loc.id },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.post.count({ where: { locationId: loc.id } }),
        prisma.post.count({ where: { locationId: loc.id, status: 'PENDING' } }),
      ]);

      const lastPost = lastPostRaw
        ? (await enrichPostsWithMedia([lastPostRaw]))[0]
        : null;

      const hasPostToday = lastPost
        ? isToday(lastPost.postedAt) || isToday(lastPost.createdAt)
        : false;

      return {
        ...loc,
        lastPost,
        totalPosts,
        pendingCount,
        hasPostToday,
      };
    }),
  );
}
