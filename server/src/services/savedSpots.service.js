const { query } = require('../config/db');

const VALID_WATER_TYPES = ['freshwater', 'brackish', 'saltwater'];

function asOptionalTrimmedString(value) {
  const trimmed = value === undefined || value === null ? '' : String(value).trim();
  return trimmed ? trimmed : null;
}

function asRequiredString(value, fieldName) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    const err = new Error(`${fieldName} is required`);
    err.status = 400;
    throw err;
  }
  return trimmed;
}

function asCoordinate(value, fieldName) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    const err = new Error(`${fieldName} must be a valid number`);
    err.status = 400;
    throw err;
  }
  return numericValue;
}

function validateCoordinateRange(lat, lng) {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    const err = new Error('latitude must be between -90 and 90, and longitude must be between -180 and 180');
    err.status = 400;
    throw err;
  }
}

function validateWaterType(value) {
  const waterType = String(value || '').trim().toLowerCase();
  if (!VALID_WATER_TYPES.includes(waterType)) {
    const err = new Error('waterType must be freshwater, brackish, or saltwater');
    err.status = 400;
    throw err;
  }
  return waterType;
}

function normalizePayload(payload, { partial = false } = {}) {
  const hasRequired = (key) => !partial || payload[key] !== undefined;

  const name = hasRequired('name') ? asRequiredString(payload.name, 'name') : null;
  const latitude = hasRequired('latitude') ? asCoordinate(payload.latitude, 'latitude') : null;
  const longitude = hasRequired('longitude') ? asCoordinate(payload.longitude, 'longitude') : null;
  const waterType = hasRequired('waterType') ? validateWaterType(payload.waterType) : null;

  if (latitude !== null && longitude !== null) {
    validateCoordinateRange(latitude, longitude);
  }

  const tideStationId = partial && payload.tideStationId === undefined
    ? undefined
    : asOptionalTrimmedString(payload.tideStationId);

  const locationLabel = partial && payload.locationLabel === undefined
    ? undefined
    : asOptionalTrimmedString(payload.locationLabel);

  const notes = partial && payload.notes === undefined
    ? undefined
    : asOptionalTrimmedString(payload.notes);

  if (waterType === 'freshwater' && tideStationId) {
    const err = new Error('tideStationId is only allowed for brackish or saltwater saved spots');
    err.status = 400;
    throw err;
  }

  if (!partial) {
    return {
      name,
      latitude,
      longitude,
      waterType,
      tideStationId,
      locationLabel,
      notes,
    };
  }

  const normalized = {};
  if (payload.name !== undefined) normalized.name = name;
  if (payload.latitude !== undefined) normalized.latitude = latitude;
  if (payload.longitude !== undefined) normalized.longitude = longitude;
  if (payload.waterType !== undefined) normalized.waterType = waterType;
  if (payload.tideStationId !== undefined) normalized.tideStationId = tideStationId;
  if (payload.locationLabel !== undefined) normalized.locationLabel = locationLabel;
  if (payload.notes !== undefined) normalized.notes = notes;

  if (
    normalized.waterType === 'freshwater' &&
    normalized.tideStationId
  ) {
    const err = new Error('tideStationId is only allowed for brackish or saltwater saved spots');
    err.status = 400;
    throw err;
  }

  return normalized;
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    waterType: row.water_type,
    tideStationId: row.tide_station_id,
    locationLabel: row.location_label,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function assertSavedSpotOwnership(userId, savedSpotId) {
  const result = await query(
    `SELECT id
     FROM saved_spots
     WHERE id = $1 AND user_id = $2`,
    [savedSpotId, userId]
  );

  if (!result.rows[0]) {
    const err = new Error('savedSpotId does not belong to the current user');
    err.status = 400;
    throw err;
  }
}

async function createSavedSpot(userId, payload) {
  const normalized = normalizePayload(payload);
  const result = await query(
    `INSERT INTO saved_spots (
       user_id,
       name,
       latitude,
       longitude,
       water_type,
       tide_station_id,
       location_label,
       notes,
       created_at,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     RETURNING id, user_id, name, latitude, longitude, water_type, tide_station_id, location_label, notes, created_at, updated_at`,
    [
      userId,
      normalized.name,
      normalized.latitude,
      normalized.longitude,
      normalized.waterType,
      normalized.tideStationId,
      normalized.locationLabel,
      normalized.notes,
    ]
  );

  return mapRow(result.rows[0]);
}

async function listSavedSpots(userId) {
  const result = await query(
    `SELECT id, user_id, name, latitude, longitude, water_type, tide_station_id, location_label, notes, created_at, updated_at
     FROM saved_spots
     WHERE user_id = $1
     ORDER BY updated_at DESC, created_at DESC, id DESC`,
    [userId]
  );

  return result.rows.map(mapRow);
}

async function getSavedSpotById(userId, savedSpotId) {
  const result = await query(
    `SELECT id, user_id, name, latitude, longitude, water_type, tide_station_id, location_label, notes, created_at, updated_at
     FROM saved_spots
     WHERE id = $1 AND user_id = $2`,
    [savedSpotId, userId]
  );

  const spot = mapRow(result.rows[0]);
  if (!spot) {
    const err = new Error('Saved spot not found');
    err.status = 404;
    throw err;
  }

  return spot;
}

async function updateSavedSpot(userId, savedSpotId, payload) {
  const normalized = normalizePayload(payload, { partial: true });
  const fields = Object.keys(normalized);

  if (fields.length === 0) {
    const err = new Error('At least one saved spot field must be provided');
    err.status = 400;
    throw err;
  }

  const columnMap = {
    name: 'name',
    latitude: 'latitude',
    longitude: 'longitude',
    waterType: 'water_type',
    tideStationId: 'tide_station_id',
    locationLabel: 'location_label',
    notes: 'notes',
  };

  const setClauses = fields.map((field, index) => `${columnMap[field]} = $${index + 1}`);
  const values = fields.map((field) => normalized[field]);

  const result = await query(
    `UPDATE saved_spots
     SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $${fields.length + 1} AND user_id = $${fields.length + 2}
     RETURNING id, user_id, name, latitude, longitude, water_type, tide_station_id, location_label, notes, created_at, updated_at`,
    [...values, savedSpotId, userId]
  );

  const spot = mapRow(result.rows[0]);
  if (!spot) {
    const err = new Error('Saved spot not found');
    err.status = 404;
    throw err;
  }

  return spot;
}

async function deleteSavedSpot(userId, savedSpotId) {
  const result = await query(
    `DELETE FROM saved_spots
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [savedSpotId, userId]
  );

  if (!result.rows[0]) {
    const err = new Error('Saved spot not found');
    err.status = 404;
    throw err;
  }
}

module.exports = {
  assertSavedSpotOwnership,
  createSavedSpot,
  listSavedSpots,
  getSavedSpotById,
  updateSavedSpot,
  deleteSavedSpot,
};
