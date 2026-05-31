import axios from 'axios';
import { env } from '../config/env.js';
import prisma from '../database/client.js';
import { AppError } from '../utils/AppError.js';

/** GoHighLevel / LeadConnector API version header */
const GHL_VERSION = '2021-07-28';

const CUSTOM_FIELD_LAST_POST_DATE = 'Last Post Date';
const CUSTOM_FIELD_POST_STATUS = 'Post Status';

async function resolveGhlAuth(locationOrGhlLocationId) {
  if (
    typeof locationOrGhlLocationId === 'object' &&
    locationOrGhlLocationId !== null &&
    locationOrGhlLocationId.ghlLocationId
  ) {
    const ghlLocationId = locationOrGhlLocationId.ghlLocationId;
    const token =
      locationOrGhlLocationId.ghlApiKey?.trim() || env.GHL_API_KEY?.trim() || '';
    return { ghlLocationId, token };
  }

  const ghlLocationId = String(locationOrGhlLocationId ?? '').trim();
  if (!ghlLocationId) {
    throw new AppError('ghlLocationId is required for GHL custom field updates.', 400, {
      code: 'GHL_LOCATION_ID_MISSING',
    });
  }

  const location = await prisma.location.findUnique({
    where: { ghlLocationId },
    select: { ghlLocationId: true, ghlApiKey: true },
  });

  const token = location?.ghlApiKey?.trim() || env.GHL_API_KEY?.trim() || '';
  return { ghlLocationId, token };
}

/**
 * Updates location custom values (GET → PUT if exists, else POST).
 * Custom value names must match what is configured in the GHL location.
 *
 * @param {string | { ghlLocationId: string, ghlApiKey?: string | null }} locationOrGhlLocationId
 * @param {string | Date} lastPostDate — stored as string in GHL (e.g. ISO)
 * @param {string} postStatus
 */
export async function updateLocationCustomFields(
  locationOrGhlLocationId,
  lastPostDate,
  postStatus,
) {
  const { ghlLocationId, token } = await resolveGhlAuth(locationOrGhlLocationId);

  const dateStr =
    lastPostDate instanceof Date ? lastPostDate.toISOString() : String(lastPostDate);
  const statusStr = String(postStatus ?? '');

  if (env.MOCK_MODE) {
    console.info(
      JSON.stringify({
        event: 'ghl_custom_fields_mock',
        ghlLocationId,
        [CUSTOM_FIELD_LAST_POST_DATE]: dateStr,
        [CUSTOM_FIELD_POST_STATUS]: statusStr,
      }),
    );
    return { success: true, mock: true };
  }
  if (!token) {
    console.warn(
      JSON.stringify({
        event: 'ghl_custom_fields_skipped',
        reason: 'GHL API key empty for location and env',
        ghlLocationId,
      }),
    );
    return { success: false, skipped: true };
  }

  const baseUrl = `https://services.leadconnectorhq.com/locations/${encodeURIComponent(ghlLocationId)}/customValues`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Version: GHL_VERSION,
  };

  const payloads = [
    { name: CUSTOM_FIELD_LAST_POST_DATE, value: dateStr },
    { name: CUSTOM_FIELD_POST_STATUS, value: statusStr },
  ];

  const existingByName = await fetchCustomValuesByName(baseUrl, headers);

  for (const body of payloads) {
    await upsertLocationCustomValue(baseUrl, headers, body.name, body.value, existingByName);
  }

  return { success: true };
}

function ghlErrorMessage(response) {
  return (
    response.data?.message ||
    response.data?.error ||
    response.data?.msg ||
    `HTTP ${response.status}`
  );
}

async function fetchCustomValuesByName(baseUrl, headers) {
  const listResponse = await axios.get(baseUrl, { headers, validateStatus: () => true });

  if (listResponse.status < 200 || listResponse.status >= 300) {
    throw new AppError(`GHL customValues API failed: ${ghlErrorMessage(listResponse)}`, 502, {
      code: 'GHL_CUSTOM_VALUES_ERROR',
      details: { status: listResponse.status, body: listResponse.data, method: 'GET' },
    });
  }

  const raw = listResponse.data?.customValues ?? [];
  const list = Array.isArray(raw) ? raw : [];
  const existingByName = new Map();

  for (const item of list) {
    if (item?.name && item?.id) {
      existingByName.set(item.name, item);
    }
  }

  return existingByName;
}

async function upsertLocationCustomValue(baseUrl, headers, name, value, existingByName) {
  const existing = existingByName.get(name);

  if (existing?.id) {
    const putUrl = `${baseUrl}/${encodeURIComponent(existing.id)}`;
    const putResponse = await axios.put(
      putUrl,
      { name, value },
      { headers, validateStatus: () => true },
    );

    if (putResponse.status >= 200 && putResponse.status < 300) {
      return;
    }

    throw new AppError(`GHL customValues API failed: ${ghlErrorMessage(putResponse)}`, 502, {
      code: 'GHL_CUSTOM_VALUES_ERROR',
      details: {
        status: putResponse.status,
        body: putResponse.data,
        field: name,
        method: 'PUT',
      },
    });
  }

  const postResponse = await axios.post(
    baseUrl,
    { name, value },
    { headers, validateStatus: () => true },
  );

  if (postResponse.status < 200 || postResponse.status >= 300) {
    throw new AppError(`GHL customValues API failed: ${ghlErrorMessage(postResponse)}`, 502, {
      code: 'GHL_CUSTOM_VALUES_ERROR',
      details: { status: postResponse.status, body: postResponse.data, field: name, method: 'POST' },
    });
  }
}
