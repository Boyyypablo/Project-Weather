import { describe, expect, it } from 'vitest';
import { resolveScene } from './weatherScene.js';

function weather(icon) {
  return { weather: [{ icon }] };
}

describe('resolveScene', () => {
  it('mostra sol de dia e lua à noite quando o céu está limpo', () => {
    expect(resolveScene(weather('01d'))).toBe('clear');
    expect(resolveScene(weather('01n'))).toBe('night');
  });

  it('diferencia poucas nuvens, nublado, chuva, tempestade, neve e neblina', () => {
    expect(resolveScene(weather('02d'))).toBe('partly');
    expect(resolveScene(weather('02n'))).toBe('night');
    expect(resolveScene(weather('04d'))).toBe('cloudy');
    expect(resolveScene(weather('10d'))).toBe('rain');
    expect(resolveScene(weather('09n'))).toBe('rain');
    expect(resolveScene(weather('11d'))).toBe('storm');
    expect(resolveScene(weather('13d'))).toBe('snow');
    expect(resolveScene(weather('50d'))).toBe('mist');
  });
});
