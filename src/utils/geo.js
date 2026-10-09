const EARTH_RADIUS_KM = 6371;

export function haversineKm(from, to) {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function getCurrentPosition(options) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(
      new Error('Geolocalização não suportada neste navegador.')
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export function readCurrentPosition(getPosition = getCurrentPosition) {
  return getPosition({
    enableHighAccuracy: false,
    timeout: 8000,
    maximumAge: 60_000,
  }).catch((error) => {
    if (error?.code === 1) throw error;
    return getPosition({
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: Number.POSITIVE_INFINITY,
    });
  });
}

const NETWORK_LOCATION_URL = 'https://get.geojs.io/v1/ip/geo.json';

export async function locateByNetwork(fetchImpl = fetch) {
  const response = await fetchImpl(NETWORK_LOCATION_URL);
  if (!response.ok) throw new Error('network-location');
  const data = await response.json();
  const lat = Number(data.latitude);
  const lon = Number(data.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('network-location');
  }
  return { lat, lon };
}

export async function geolocationPermissionState(
  permissions = globalThis.navigator?.permissions
) {
  try {
    if (!permissions?.query) return 'unknown';
    const status = await permissions.query({ name: 'geolocation' });
    return status.state || 'unknown';
  } catch {
    return 'unknown';
  }
}

export function locationFailureMessage(permissionState) {
  if (permissionState === 'denied') {
    return 'O Chrome bloqueou a localização deste site. No ícone ao lado do endereço, ative Local e recarregue a página.';
  }
  if (permissionState === 'granted') {
    return 'O site tem permissão, mas o Windows está com a localização desligada. Ative em Configurações, Privacidade e segurança, Localização.';
  }
  return 'Não consegui ler sua localização. Tente novamente.';
}

export function networkLocationHint(permissionState) {
  if (permissionState === 'denied') {
    return 'Localização aproximada pela rede. Ative Local nas permissões do site para a posição exata.';
  }
  if (permissionState === 'granted') {
    return 'Localização aproximada pela rede. Ative a Localização do Windows para a posição exata.';
  }
  return 'Localização aproximada pela rede.';
}
