import { describe, expect, it, vi } from 'vitest';
import {
  locateByNetwork,
  locationFailureMessage,
  networkLocationHint,
  readCurrentPosition,
} from './geo.js';

describe('readCurrentPosition', () => {
  it('devolve a primeira leitura quando ela funciona', async () => {
    const position = { coords: { latitude: 1, longitude: 2 } };
    const getPosition = vi.fn().mockResolvedValue(position);

    await expect(readCurrentPosition(getPosition)).resolves.toBe(position);
    expect(getPosition).toHaveBeenCalledTimes(1);
  });

  it('tenta de novo sem exigir uma leitura nova quando a primeira falha', async () => {
    const position = { coords: { latitude: -15.7, longitude: -47.9 } };
    const getPosition = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('timeout'), { code: 3 }))
      .mockResolvedValueOnce(position);

    await expect(readCurrentPosition(getPosition)).resolves.toBe(position);
    expect(getPosition).toHaveBeenCalledTimes(2);
    expect(getPosition.mock.calls[1][0].maximumAge).toBe(Number.POSITIVE_INFINITY);
  });

  it('não insiste quando o navegador bloqueia a permissão', async () => {
    const getPosition = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('denied'), { code: 1 }));

    await expect(readCurrentPosition(getPosition)).rejects.toMatchObject({
      code: 1,
    });
    expect(getPosition).toHaveBeenCalledTimes(1);
  });
});

describe('locateByNetwork', () => {
  it('lê latitude e longitude em texto', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ latitude: '-15.7798', longitude: '-47.9331' }),
    });

    await expect(locateByNetwork(fetchImpl)).resolves.toEqual({
      lat: -15.7798,
      lon: -47.9331,
    });
  });

  it('falha quando a resposta não traz coordenadas', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ city: 'Brasília' }),
    });

    await expect(locateByNetwork(fetchImpl)).rejects.toThrow('network-location');
  });
});

describe('mensagens de localização', () => {
  it('explica bloqueio do site e do Windows', () => {
    expect(locationFailureMessage('denied')).toMatch(/ative Local/i);
    expect(locationFailureMessage('granted')).toMatch(/Windows/i);
    expect(networkLocationHint('granted')).toMatch(/aproximada/i);
    expect(networkLocationHint('prompt')).toBe(
      'Localização aproximada pela rede.'
    );
  });
});
