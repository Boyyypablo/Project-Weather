import { describe, expect, it } from 'vitest';
import { haversineKm } from './geo.js';
import { formatPlaceDetail, formatPlaceHint } from './placeLabel.js';
import { rankPlaces } from './rankPlaces.js';

const saoPaulo = {
  name: 'São Paulo',
  lat: -23.55,
  lon: -46.63,
  population: 12_400_000,
  admin1: 'São Paulo',
  admin2: 'São Paulo',
  country: 'BR',
  countryName: 'Brasil',
  kind: 'city',
};

const saoPauloSmall = {
  name: 'São Paulo',
  lat: -1.45,
  lon: -48.5,
  population: 500,
  admin1: 'Pará',
  country: 'BR',
  countryName: 'Brasil',
  kind: 'village',
};

const campinas = {
  name: 'Campinas',
  lat: -22.91,
  lon: -47.06,
  population: 1_200_000,
  admin1: 'São Paulo',
  country: 'BR',
  countryName: 'Brasil',
  kind: 'municipality',
};

const campinaGrande = {
  name: 'Campina Grande',
  lat: -7.23,
  lon: -35.88,
  population: 400_000,
  admin1: 'Paraíba',
  country: 'BR',
  countryName: 'Brasil',
  kind: 'city',
};

const campoBelo = {
  name: 'Campo Belo',
  lat: -23.63,
  lon: -46.67,
  population: 0,
  admin1: 'São Paulo',
  admin2: 'São Paulo',
  country: 'BR',
  countryName: 'Brasil',
  kind: 'suburb',
};

describe('rankPlaces', () => {
  it('sem coordenadas, prioriza a cidade maior quando o nome coincide', () => {
    const ranked = rankPlaces([saoPauloSmall, saoPaulo], { query: 'São Paulo' });

    expect(ranked[0]).toMatchObject({ lat: saoPaulo.lat, admin1: 'São Paulo' });
  });

  it('com coordenadas, prioriza o lugar mais próximo do usuário', () => {
    const ranked = rankPlaces([campinaGrande, campinas], {
      query: 'camp',
      coords: { lat: -22.9, lon: -47.06 },
    });

    expect(ranked[0].name).toBe('Campinas');
    expect(ranked[0].distanceKm).toBeLessThan(5);
    expect(ranked[1].name).toBe('Campina Grande');
  });

  it('ignora acentos na comparação do nome', () => {
    const ranked = rankPlaces([saoPaulo], { query: 'sao paulo' });

    expect(ranked).toHaveLength(1);
    expect(ranked[0].name).toBe('São Paulo');
  });

  it('descarta resultados cujo nome não contém a busca', () => {
    const ranked = rankPlaces(
      [campinas, { ...saoPaulo, name: 'Fort Worth' }],
      { query: 'camp' }
    );

    expect(ranked.map((place) => place.name)).toEqual(['Campinas']);
  });

  it('remove duplicatas e mantém as cidades que combinam com a busca', () => {
    const ranked = rankPlaces(
      [campinas, { ...campinas, id: 'dup' }, campinaGrande, saoPaulo],
      { query: 'camp', limit: 2 }
    );

    expect(ranked.map((place) => place.name)).toEqual([
      'Campinas',
      'Campina Grande',
    ]);
  });

  it('prefixo curto prioriza o bairro mais próximo da pessoa', () => {
    const ranked = rankPlaces([campinas, campoBelo], {
      query: 'camp',
      coords: { lat: -23.55, lon: -46.63 },
    });

    expect(ranked[0].name).toBe('Campo Belo');
  });

  it('um vilarejo distante com o nome exato perde para a cidade grande mais perto', () => {
    const campVillage = {
      name: 'Camp',
      lat: 46.47,
      lon: 22.44,
      population: 261,
      admin1: 'Bihor',
      country: 'RO',
      countryName: 'Romênia',
      kind: 'village',
    };

    const ranked = rankPlaces([campVillage, campinas], {
      query: 'camp',
      coords: { lat: -15.78, lon: -47.93 },
      preferredCountry: 'BR',
    });

    expect(ranked[0].name).toBe('Campinas');
  });

  it('o nome completo da cidade continua encontrável mesmo com um bairro perto', () => {
    const ranked = rankPlaces([campoBelo, campinas], {
      query: 'Campinas',
      coords: { lat: -23.55, lon: -46.63 },
    });

    expect(ranked.map((place) => place.name)).toEqual(['Campinas']);
  });
});

describe('formatPlaceDetail', () => {
  it('descreve bairro com cidade e país', () => {
    expect(formatPlaceDetail(campoBelo)).toBe(
      'bairro · São Paulo, Brasil'
    );
  });

  it('descreve cidade com estado e país, sem repetir o nome', () => {
    expect(formatPlaceDetail(campinas)).toBe('São Paulo, Brasil');
  });

  it('inclui a distância quando a localização do usuário é conhecida', () => {
    expect(formatPlaceHint({ ...campinas, distanceKm: 86.2 })).toBe(
      'São Paulo, Brasil · 86 km'
    );
    expect(formatPlaceHint({ ...campoBelo, distanceKm: 0.4 })).toBe(
      'bairro · São Paulo, Brasil · perto de você'
    );
  });
});

describe('haversineKm', () => {
  it('calcula uma distância curta como quase zero', () => {
    expect(
      haversineKm({ lat: -23.55, lon: -46.63 }, { lat: -23.55, lon: -46.63 })
    ).toBe(0);
  });

  it('estima centenas de quilômetros entre São Paulo e o Rio', () => {
    const km = haversineKm(
      { lat: -23.55, lon: -46.63 },
      { lat: -22.91, lon: -43.17 }
    );

    expect(km).toBeGreaterThan(300);
    expect(km).toBeLessThan(450);
  });
});
