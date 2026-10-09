function shiftToLocal(unixSeconds, timezoneOffset) {
  return new Date((unixSeconds + timezoneOffset) * 1000);
}

export function localDateKey(unixSeconds, timezoneOffset = 0) {
  const local = shiftToLocal(unixSeconds, timezoneOffset);
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return `${local.getUTCFullYear()}-${month}-${day}`;
}

function addDays(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

function localHour(unixSeconds, timezoneOffset) {
  return shiftToLocal(unixSeconds, timezoneOffset).getUTCHours();
}

function pickMidday(slots, timezoneOffset) {
  return slots.reduce((best, slot) => {
    const hour = localHour(slot.dt, timezoneOffset);
    const bestHour = localHour(best.dt, timezoneOffset);
    return Math.abs(hour - 13) < Math.abs(bestHour - 13) ? slot : best;
  });
}

function pickRepresentative(slots, timezoneOffset) {
  const wettest = slots.reduce((best, slot) =>
    (slot.pop ?? 0) > (best.pop ?? 0) ? slot : best
  );
  if ((wettest.pop ?? 0) >= 0.4) return wettest;
  return pickMidday(slots, timezoneOffset);
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function dayLabel(dateKey, todayKey) {
  if (dateKey === todayKey) return 'Hoje';
  if (dateKey === addDays(todayKey, 1)) return 'Amanhã';

  const [year, month, day] = dateKey.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return WEEKDAYS[weekday];
}

export function groupForecastByDay(
  list = [],
  timezoneOffset = 0,
  now = Date.now()
) {
  const todayKey = localDateKey(Math.floor(now / 1000), timezoneOffset);
  const groups = new Map();

  for (const item of list) {
    if (!item?.dt || !item.weather?.[0]) continue;
    const key = localDateKey(item.dt, timezoneOffset);
    const slots = groups.get(key) ?? [];
    slots.push(item);
    groups.set(key, slots);
  }

  return [...groups.entries()].map(([date, slots]) => {
    const midday = pickRepresentative(slots, timezoneOffset);
    const pop = Math.max(...slots.map((slot) => slot.pop ?? 0));

    return {
      date,
      label: dayLabel(date, todayKey),
      min: Math.round(Math.min(...slots.map((slot) => slot.main.temp_min))),
      max: Math.round(Math.max(...slots.map((slot) => slot.main.temp_max))),
      description: midday.weather[0].description,
      icon: midday.weather[0].icon,
      pop: Math.round(pop * 100),
    };
  });
}
