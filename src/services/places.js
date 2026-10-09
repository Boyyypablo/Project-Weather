import axios from 'axios';

const PHOTON_URL = 'https://photon.komoot.io/api/';
const OPEN_METEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const OPEN_WEATHER_GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

export function isRequestCanceled(error) {
  return (
    axios.isCancel(error) ||
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||
    error?.name === 'AbortError'
  );
}

const CITY_FEATURE_CODES = new Set([
  'PPLC',
  'PPLA',
  'PPLA2',
  'PPLA3',
  'PPLA4',
]);

function normalizeOpenMeteo(place) {
  const population = place.population ?? 0;
  const isCity =
    CITY_FEATURE_CODES.has(place.feature_code) || population >= 50000;

  return {
    id: String(place.id),
    name: place.name,
    country: place.country_code ?? '',
    countryName: place.country ?? '',
    admin1: place.admin1 ?? '',
    admin2: place.admin2 ?? '',
    kind: isCity ? 'city' : 'village',
    lat: place.latitude,
    lon: place.longitude,
    population: place.population ?? 0,
  };
}

function normalizePhoton(feature) {
  const place = feature.properties ?? {};
  const [lon, lat] = feature.geometry?.coordinates ?? [];

  return {
    id: `${place.osm_type ?? ''}${place.osm_id ?? ''}`,
    name: place.name,
    country: place.countrycode ?? '',
    countryName: place.country ?? '',
    admin1: place.state ?? '',
    admin2: place.city || place.county || '',
    kind: place.osm_value || place.type || '',
    lat,
    lon,
    population: 0,
  };
}

function normalizeOpenWeather(place) {
  return {
    id: `${place.lat}-${place.lon}`,
    name: place.name,
    country: place.country ?? '',
    countryName: '',
    admin1: place.state ?? '',
    admin2: '',
    kind: 'city',
    lat: place.lat,
    lon: place.lon,
    population: 0,
  };
}

async function searchPhoton(query, coords, signal) {
  const resp = await axios.get(PHOTON_URL, {
    signal,
    params: {
      q: query,
      lat: coords.lat,
      lon: coords.lon,
      limit: 15,
      lang: 'default',
      osm_tag: 'place',
    },
  });

  return (resp.data.features ?? [])
    .map(normalizePhoton)
    .filter((place) => place.name && Number.isFinite(place.lat));
}

async function searchOpenMeteo(query, signal) {
  const resp = await axios.get(OPEN_METEO_URL, {
    signal,
    params: {
      name: query,
      count: 15,
      language: 'pt',
      format: 'json',
    },
  });

  return (resp.data.results ?? []).map(normalizeOpenMeteo);
}

async function searchOpenWeather(query, signal, apiKey) {
  const resp = await axios.get(OPEN_WEATHER_GEO_URL, {
    signal,
    params: {
      q: query,
      limit: 5,
      appid: apiKey,
    },
  });

  return (resp.data ?? []).map(normalizeOpenWeather);
}

export async function searchPlaces(query, { signal, coords, apiKey } = {}) {
  const requests = [searchOpenMeteo(query, signal)];
  if (coords) requests.push(searchPhoton(query, coords, signal));

  const settled = await Promise.allSettled(requests);
  const places = [];

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      places.push(...result.value);
      continue;
    }
    if (isRequestCanceled(result.reason)) throw result.reason;
  }

  if (places.length > 0 || !apiKey) return places;

  return searchOpenWeather(query, signal, apiKey);
}
