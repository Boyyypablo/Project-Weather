const KIND_LABEL = {
  suburb: 'bairro',
  neighbourhood: 'bairro',
  neighborhood: 'bairro',
  quarter: 'bairro',
  district: 'distrito',
  locality: 'localidade',
  hamlet: 'povoado',
  village: 'vila',
};

export function formatPlaceDetail(place) {
  const region = [];

  if (place.admin2 && place.admin2 !== place.name) region.push(place.admin2);
  if (
    place.admin1 &&
    place.admin1 !== place.name &&
    place.admin1 !== place.admin2
  ) {
    region.push(place.admin1);
  }
  if (place.countryName) region.push(place.countryName);
  else if (place.country) region.push(place.country);

  const where = region.join(', ');
  const kind = KIND_LABEL[place.kind];

  if (kind) return where ? `${kind} · ${where}` : kind;
  return where;
}

export function formatPlaceHint(place) {
  const detail = formatPlaceDetail(place);
  if (place.distanceKm == null) return detail;

  const distance =
    place.distanceKm < 1
      ? 'perto de você'
      : `${Math.round(place.distanceKm)} km`;

  return detail ? `${detail} · ${distance}` : distance;
}
