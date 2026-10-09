export function resolveScene(weather) {
  const icon = weather?.weather?.[0]?.icon ?? '';
  const code = icon.slice(0, 2);
  const night = icon.endsWith('n');

  if (code === '11') return 'storm';
  if (code === '09' || code === '10') return 'rain';
  if (code === '13') return 'snow';
  if (code === '50') return 'mist';
  if (code === '03' || code === '04') return 'cloudy';
  if (code === '02') return night ? 'night' : 'partly';
  if (night) return 'night';
  return 'clear';
}
