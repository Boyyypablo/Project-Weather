import { describe, expect, it } from 'vitest';
import { groupForecastByDay, localDateKey } from './forecast.js';

const BRT = -3 * 60 * 60;

function slot(isoUtc, temp, icon = '01d', pop = 0) {
  return {
    dt: Date.parse(isoUtc) / 1000,
    main: { temp, temp_min: temp - 1, temp_max: temp + 1 },
    weather: [{ description: 'céu limpo', icon }],
    pop,
  };
}

describe('localDateKey', () => {
  it('usa o fuso da cidade, não o horário UTC do bloco', () => {
    expect(localDateKey(Date.parse('2026-10-10T02:00:00Z') / 1000, BRT)).toBe(
      '2026-10-09'
    );
  });
});

describe('groupForecastByDay', () => {
  const now = Date.parse('2026-10-09T15:00:00Z');

  it('agrupa os blocos de 3 horas em dias e marca hoje e amanhã', () => {
    const days = groupForecastByDay(
      [
        slot('2026-10-09T18:00:00Z', 30, '01d'),
        slot('2026-10-10T02:00:00Z', 24, '01n'),
        slot('2026-10-10T15:00:00Z', 31, '02d', 0.4),
        slot('2026-10-11T15:00:00Z', 28, '10d', 0.8),
      ],
      BRT,
      now
    );

    expect(days.map((day) => day.label)).toEqual(['Hoje', 'Amanhã', 'dom']);
    expect(days[0]).toMatchObject({ min: 23, max: 31 });
    expect(days[1]).toMatchObject({
      icon: '02d',
      pop: 40,
      min: 30,
      max: 32,
    });
    expect(days[2].icon).toBe('10d');
  });

  it('escolhe o ícone mais perto do meio-dia', () => {
    const days = groupForecastByDay(
      [
        slot('2026-10-09T09:00:00Z', 20, '01n'),
        slot('2026-10-09T15:00:00Z', 28, '10d'),
        slot('2026-10-09T21:00:00Z', 26, '04d'),
      ],
      0,
      now
    );

    expect(days[0].icon).toBe('10d');
  });

  it('quando algum horário tem chuva forte, o dia mostra essa condição', () => {
    const days = groupForecastByDay(
      [
        slot('2026-10-09T15:00:00Z', 28, '01d', 0),
        slot('2026-10-09T21:00:00Z', 24, '10d', 1),
      ],
      0,
      now
    );

    expect(days[0]).toMatchObject({ icon: '10d', pop: 100 });
  });
});
