import { haversineKm } from './geo.js';

const CITY_KINDS = new Set(['city', 'town', 'municipality']);

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function nameScore(name, query) {
  if (name === query && query.length >= 5) return 500;
  if (name === query) return 120;
  if (name.startsWith(query)) return 200;
  if (name.includes(query)) return 80;
  return 0;
}

function dedupeKey(place) {
  const name = normalizeText(place.name);
  const area = normalizeText(place.admin2);

  return [
    name,
    area && area !== name ? area : '',
    normalizeText(place.admin1),
    normalizeText(place.country || place.countryName),
  ].join('|');
}

export function rankPlaces(
  places,
  { query = '', coords = null, preferredCountry = '', limit = 5 } = {}
) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const scored = places.map((place) => {
    const match = nameScore(normalizeText(place.name), normalizedQuery);
    if (match === 0) return null;

    let score = match;
    let distanceKm;

    if (coords && Number.isFinite(place.lat) && Number.isFinite(place.lon)) {
      const km = haversineKm(coords, { lat: place.lat, lon: place.lon });
      distanceKm = Math.round(km * 10) / 10;
      score += 800 / (1 + km / 40);
    }

    if (place.population > 0) {
      score += Math.min(180, Math.log10(place.population) * 25);
    }

    if (
      preferredCountry &&
      place.country?.toUpperCase() === preferredCountry.toUpperCase()
    ) {
      score += 120;
    }

    if (CITY_KINDS.has(place.kind) && match >= 120) {
      score += 60;
    }

    return {
      score,
      population: place.population ?? 0,
      place: distanceKm == null ? place : { ...place, distanceKm },
    };
  });

  const seen = new Set();
  const unique = [];
  const ordered = scored
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.population - a.population);

  for (const item of ordered) {
    const key = dedupeKey(item.place);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item.place);
    if (unique.length === limit) break;
  }

  return unique;
}
