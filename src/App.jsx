import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';
import WeatherInformations from './components/WeatherInformations/WeatherInformations';
import { isRequestCanceled, searchPlaces } from './services/places';
import {
  geolocationPermissionState,
  haversineKm,
  locateByNetwork,
  locationFailureMessage,
  networkLocationHint,
  readCurrentPosition,
} from './utils/geo';
import { formatPlaceHint } from './utils/placeLabel';
import { rankPlaces } from './utils/rankPlaces';
import { groupForecastByDay } from './utils/forecast';

const API_KEY = '71bdaaed1643cbb91fadf3068faf912c';

const POPULAR_CITIES = [
  { name: 'São Paulo', country: 'BR', lat: -23.55, lon: -46.63 },
  { name: 'Rio de Janeiro', country: 'BR', lat: -22.91, lon: -43.17 },
  { name: 'Brasília', country: 'BR', lat: -15.78, lon: -47.93 },
  { name: 'Salvador', country: 'BR', lat: -12.97, lon: -38.51 },
  { name: 'Curitiba', country: 'BR', lat: -25.43, lon: -49.27 },
  { name: 'Lisboa', country: 'PT', lat: 38.72, lon: -9.14 },
];

function App() {
  const [weather, setWeather] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nearbyCities, setNearbyCities] = useState([]);
  const [nearbyLabel, setNearbyLabel] = useState('Cidades populares');
  const [locationStatus, setLocationStatus] = useState('idle');
  const [usingDeviceLocation, setUsingDeviceLocation] = useState(false);
  const [locationSource, setLocationSource] = useState(null);
  const [locationBlock, setLocationBlock] = useState('');
  const [forecast, setForecast] = useState([]);

  const inputRef = useRef();
  const debounceRef = useRef(null);
  const searchWrapperRef = useRef();
  const placesAbortRef = useRef(null);
  const requestIdRef = useRef(0);
  const userCoordsRef = useRef(null);
  const locationRequestRef = useRef(0);
  const userCountryRef = useRef('');
  const userEditedRef = useRef(false);
  const suggestionQueryRef = useRef('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showPopularCities = useCallback(() => {
    setNearbyCities(POPULAR_CITIES);
    setNearbyLabel('Cidades populares');
  }, []);

  const fetchWeatherByCoords = useCallback(async (lat, lon) => {
    const resp = await axios.get(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          lat,
          lon,
          appid: API_KEY,
          lang: 'pt_br',
          units: 'metric',
        },
      }
    );
    return resp.data;
  }, []);

  const fetchForecastByCoords = useCallback(async (lat, lon) => {
    const resp = await axios.get(
      'https://api.openweathermap.org/data/2.5/forecast',
      {
        params: {
          lat,
          lon,
          appid: API_KEY,
          lang: 'pt_br',
          units: 'metric',
        },
      }
    );
    return groupForecastByDay(
      resp.data.list ?? [],
      resp.data.city?.timezone ?? 0
    );
  }, []);

  const searchByCoords = useCallback(
    async (lat, lon, { fromDevice = false, replaceInput = false, source = 'device' } = {}) => {
      setLoading(true);
      setError('');
      setShowSuggestions(false);
      if (!fromDevice) {
        setUsingDeviceLocation(false);
        setLocationSource(null);
      } else {
        setUsingDeviceLocation(true);
        setLocationSource(source);
      }

      try {
        const [data, days] = await Promise.all([
          fetchWeatherByCoords(lat, lon),
          fetchForecastByCoords(lat, lon).catch(() => []),
        ]);
        if (data.sys?.country) userCountryRef.current = data.sys.country;
        setWeather(data);
        setForecast(days);
        if (fromDevice) {
          setUsingDeviceLocation(true);
          if (replaceInput || !userEditedRef.current) {
            setInputValue(data.name ?? '');
            if (replaceInput) userEditedRef.current = false;
          }
        }
      } catch (err) {
        console.error('Erro ao buscar informações:', err);
        setError('Não foi possível buscar os dados meteorológicos.');
        setWeather(undefined);
        setForecast([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchWeatherByCoords, fetchForecastByCoords]
  );

  const requestLocation = useCallback(
    ({ replaceInput = false } = {}) => {
      const requestId = ++locationRequestRef.current;
      setError('');
      setLocationStatus('pending');
      if (replaceInput) window.scrollTo({ top: 0, behavior: 'smooth' });

      const cached = userCoordsRef.current;
      if (cached) {
        searchByCoords(cached.lat, cached.lon, {
          fromDevice: true,
          replaceInput,
          source: cached.source ?? 'device',
        });
      } else {
        setLoading(true);
      }

      readCurrentPosition()
        .then((position) => {
          if (requestId !== locationRequestRef.current) return null;
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          const changed = !cached || haversineKm(cached, coords) > 0.3;
          userCoordsRef.current = { ...coords, source: 'device' };
          setLocationBlock('');
          setLocationSource('device');
          setLocationStatus('granted');
          if (!changed) return null;
          return searchByCoords(coords.lat, coords.lon, {
            fromDevice: true,
            replaceInput,
            source: 'device',
          });
        })
        .catch(async () => {
          if (requestId !== locationRequestRef.current) return;
          if (cached) {
            setLocationStatus('granted');
            return;
          }

          try {
            const coords = await locateByNetwork();
            if (requestId !== locationRequestRef.current) return;
            const permission = await geolocationPermissionState();
            if (requestId !== locationRequestRef.current) return;
            userCoordsRef.current = { ...coords, source: 'network' };
            setLocationBlock(
              permission === 'denied' || permission === 'granted'
                ? permission
                : ''
            );
            setLocationStatus('granted');
            return searchByCoords(coords.lat, coords.lon, {
              fromDevice: true,
              replaceInput,
              source: 'network',
            });
          } catch {
            if (requestId !== locationRequestRef.current) return;
            setLoading(false);
            setLocationStatus('denied');
            showPopularCities();
            const permission = await geolocationPermissionState();
            if (requestId !== locationRequestRef.current) return;
            setError(locationFailureMessage(permission));
          }
        });
    },
    [searchByCoords, showPopularCities]
  );

  useEffect(() => {
    if (!navigator.permissions?.query) return undefined;
    let permissionStatus;
    let active = true;

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (!active) return;
        permissionStatus = status;
        status.onchange = () => {
          if (status.state === 'granted') {
            userCoordsRef.current = null;
            requestLocation({ replaceInput: true });
          }
        };
      })
      .catch(() => {});

    return () => {
      active = false;
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, [requestLocation]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      placesAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(e) {
    const value = e.target.value;
    userEditedRef.current = true;
    setInputValue(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      suggestionQueryRef.current = '';
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const query = value.trim();
      placesAbortRef.current?.abort();
      const controller = new AbortController();
      placesAbortRef.current = controller;
      const requestId = ++requestIdRef.current;

      try {
        const places = await searchPlaces(query, {
          signal: controller.signal,
          coords: userCoordsRef.current,
          apiKey: API_KEY,
        });
        if (requestId !== requestIdRef.current) return;

        const ranked = rankPlaces(places, {
          query,
          coords: userCoordsRef.current,
          preferredCountry: userCountryRef.current,
        });
        suggestionQueryRef.current = query;
        setSuggestions(ranked);
        setShowSuggestions(ranked.length > 0);
      } catch (err) {
        if (isRequestCanceled(err) || requestId !== requestIdRef.current) return;
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }

  async function searchCity() {
    const city = inputValue.trim();
    if (!city) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setShowSuggestions(false);
    userEditedRef.current = true;
    setUsingDeviceLocation(false);

    if (suggestions.length > 0 && suggestionQueryRef.current === city) {
      const best = suggestions[0];
      setInputValue(best.name);
      setSuggestions([]);
      searchByCoords(best.lat, best.lon);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const places = await searchPlaces(city, {
        coords: userCoordsRef.current,
        apiKey: API_KEY,
      });
      const [best] = rankPlaces(places, {
        query: city,
        coords: userCoordsRef.current,
        preferredCountry: userCountryRef.current,
        limit: 1,
      });

      if (!best) {
        setError('Cidade não encontrada. Tente novamente.');
        setWeather(undefined);
        setForecast([]);
        return;
      }

      const [data, days] = await Promise.all([
        fetchWeatherByCoords(best.lat, best.lon),
        fetchForecastByCoords(best.lat, best.lon).catch(() => []),
      ]);
      if (data.sys?.country) userCountryRef.current = data.sys.country;
      setInputValue(best.name);
      setSuggestions([]);
      setWeather(data);
      setForecast(days);
    } catch (err) {
      console.error('Erro ao buscar informações da cidade:', err);
      setError('Cidade não encontrada. Tente novamente.');
      setWeather(undefined);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  }

  function selectSuggestion(place) {
    userEditedRef.current = true;
    setUsingDeviceLocation(false);
    setInputValue(place.name);
    setSuggestions([]);
    setShowSuggestions(false);
    searchByCoords(place.lat, place.lon);
  }

  function selectNearbyCity(city) {
    userEditedRef.current = true;
    setUsingDeviceLocation(false);
    setInputValue(city.name);
    searchByCoords(city.lat, city.lon);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      searchCity();
    }
  }

  function getWeatherTheme() {
    if (!weather) return 'default';
    const temp = weather.main.temp;
    const condition = weather.weather[0].main.toLowerCase();

    if (condition.includes('thunder')) return 'stormy';
    if (condition.includes('rain') || condition.includes('drizzle'))
      return 'rainy';
    if (condition.includes('snow')) return 'snowy';
    if (condition.includes('cloud')) return 'cloudy';
    if (
      condition.includes('mist') ||
      condition.includes('fog') ||
      condition.includes('haze')
    )
      return 'misty';
    if (weather.weather[0].icon?.endsWith('n')) return 'night';
    if (temp >= 35) return 'hot';
    if (temp >= 22) return 'warm';
    if (temp >= 10) return 'cool';
    return 'cold';
  }

  const theme = getWeatherTheme();

  const dateString = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeString = currentTime.toLocaleTimeString('pt-BR');

  return (
    <div
      className={`app-container ${theme}${
        theme === 'hot' || theme === 'warm' ? ' sunny' : ''
      }`}
    >
      {/* Weather-specific particle layers — key forces re-mount + fade on theme change */}
      <div className="weather-particles" key={theme}>
        {/* Multi-layer rain */}
        {(theme === 'rainy' || theme === 'stormy') && (
          <>
            {Array.from({ length: 70 }).map((_, i) => (
              <div
                key={`r${i}`}
                className={`raindrop ${i < 25 ? 'rain-near' : i < 50 ? 'rain-mid' : 'rain-far'}`}
                style={{
                  left: `${(i * 1.47) % 100}%`,
                  animationDelay: `${(i * 0.09) % 1.8}s`,
                }}
              />
            ))}
          </>
        )}

        {/* Multi-size snow */}
        {theme === 'snowy' && (
          <>
            {Array.from({ length: 65 }).map((_, i) => (
              <div
                key={`s${i}`}
                className={`snowflake ${i % 3 === 0 ? 'snow-lg' : i % 3 === 1 ? 'snow-md' : 'snow-sm'}`}
                style={{
                  left: `${(i * 1.6) % 100}%`,
                  animationDelay: `${(i * 0.25) % 7}s`,
                }}
              />
            ))}
          </>
        )}

        {/* Drifting cloud blobs */}
        {theme === 'cloudy' && (
          <>
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={`c${i}`}
                className="cloud-blob"
                style={{
                  top: `${5 + i * 13}%`,
                  width: `${180 + (i % 3) * 100}px`,
                  height: `${90 + (i % 3) * 50}px`,
                  animationDuration: `${30 + i * 8}s`,
                  animationDelay: `${-i * 6}s`,
                  opacity: 0.04 + (i % 3) * 0.025,
                }}
              />
            ))}
          </>
        )}

        {/* Mist / fog layers */}
        {theme === 'misty' && (
          <>
            <div className="mist-layer mist-1" />
            <div className="mist-layer mist-2" />
            <div className="mist-layer mist-3" />
          </>
        )}

        {theme === 'night' &&
          Array.from({ length: 28 }).map((_, i) => (
            <span
              key={`star${i}`}
              className="night-star"
              style={{
                left: `${(i * 13.7) % 100}%`,
                top: `${(i * 19.3) % 78}%`,
                animationDelay: `${(i * 0.27) % 3}s`,
                width: i % 5 === 0 ? 3 : 2,
                height: i % 5 === 0 ? 3 : 2,
              }}
            />
          ))}

        {(theme === 'hot' || theme === 'warm') && <div className="day-sun" />}

        {(theme === 'hot' ||
          theme === 'warm' ||
          theme === 'cool' ||
          theme === 'cold' ||
          theme === 'default') && (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`o${i}`}
                className="ambient-orb"
                style={{
                  left: `${8 + (i * 19) % 80}%`,
                  top: `${8 + (i * 22) % 75}%`,
                  width: `${80 + (i % 3) * 50}px`,
                  height: `${80 + (i % 3) * 50}px`,
                  animationDelay: `${i * 3}s`,
                  animationDuration: `${14 + (i % 4) * 5}s`,
                }}
              />
            ))}
          </>
        )}
      </div>

      <div className="main-content">
        <div className="date-time-info">
          <p className="current-date">{dateString}</p>
          <p className="current-time">{timeString}</p>
        </div>

        <h1 className="app-title">Previsão do Tempo</h1>

        <div className="search-wrapper" ref={searchWrapperRef}>
          <div className="search-container">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() =>
                suggestions.length > 0 && setShowSuggestions(true)
              }
              placeholder="Buscar cidade..."
              className="search-input"
              autoComplete="off"
            />
            <button
              onClick={searchCity}
              className="search-button"
              aria-label="Buscar"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul className="autocomplete-dropdown">
              {suggestions.map((s, i) => (
                <li
                  key={`${s.lat}-${s.lon}-${i}`}
                  className="autocomplete-item"
                  onClick={() => selectSuggestion(s)}
                >
                  <svg
                    className="autocomplete-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div className="autocomplete-text">
                    <span className="autocomplete-name">{s.name}</span>
                    <span className="autocomplete-detail">
                      {formatPlaceHint(s)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          className="location-button"
          onClick={() => requestLocation({ replaceInput: true })}
        >
          {locationStatus === 'pending' && !userCoordsRef.current
            ? 'Obtendo sua localização...'
            : 'Usar minha localização'}
        </button>

        {usingDeviceLocation && weather && !loading && (
          <p className="location-hint">
            {locationSource === 'network'
              ? networkLocationHint(locationBlock)
              : 'Mostrando o tempo da sua localização'}
          </p>
        )}

        {locationStatus === 'denied' && !weather && (
          <p className="location-hint">
            Sem acesso à localização. Busque pelo nome ou escolha uma cidade.
          </p>
        )}

        {nearbyCities.length > 0 && !weather && (
          <div className="nearby-section">
            <p className="nearby-label">{nearbyLabel}</p>
            <div className="nearby-chips">
              {nearbyCities.map((city, i) => (
                <button
                  key={`${city.name}-${i}`}
                  className="nearby-chip"
                  onClick={() => selectNearbyCity(city)}
                >
                  {city.icon && (
                    <img
                      src={`https://openweathermap.org/img/wn/${city.icon}.png`}
                      alt=""
                      className="nearby-chip-icon"
                    />
                  )}
                  <span>{city.name}</span>
                  {city.temp !== undefined && (
                    <span className="nearby-chip-temp">{city.temp}°</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        )}

        {weather && !loading && (
          <WeatherInformations weather={weather} forecast={forecast} />
        )}
      </div>
    </div>
  );
}

export default App;
