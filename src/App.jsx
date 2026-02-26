import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import WeatherInformations from './components/WeatherInformations/WeatherInformations';

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

  const inputRef = useRef();
  const debounceRef = useRef(null);
  const searchWrapperRef = useRef();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setNearbyCities(POPULAR_CITIES);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const resp = await axios.get(
            `https://api.openweathermap.org/data/2.5/find?lat=${latitude}&lon=${longitude}&cnt=6&appid=${API_KEY}&lang=pt_br&units=metric`
          );
          if (resp.data.list?.length > 0) {
            setNearbyCities(
              resp.data.list.map((c) => ({
                name: c.name,
                country: c.sys.country,
                lat: c.coord.lat,
                lon: c.coord.lon,
                temp: Math.round(c.main.temp),
                icon: c.weather[0].icon,
              }))
            );
            setNearbyLabel('Próximo de você');
          } else {
            setNearbyCities(POPULAR_CITIES);
          }
        } catch {
          setNearbyCities(POPULAR_CITIES);
        }
      },
      () => {
        setNearbyCities(POPULAR_CITIES);
      }
    );
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
    setInputValue(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const resp = await axios.get(
          `https://api.openweathermap.org/geo/1.0/direct?q=${value.trim()}&limit=5&appid=${API_KEY}`
        );
        setSuggestions(resp.data);
        setShowSuggestions(resp.data.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }

  async function searchByCoords(lat, lon) {
    setLoading(true);
    setError('');
    setShowSuggestions(false);
    try {
      const resp = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&lang=pt_br&units=metric`
      );
      setWeather(resp.data);
    } catch (err) {
      console.error('Erro ao buscar informações:', err);
      setError('Não foi possível buscar os dados meteorológicos.');
      setWeather(undefined);
    } finally {
      setLoading(false);
    }
  }

  async function searchCity() {
    const city = inputValue.trim();
    if (!city) return;

    setLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      const resp = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&lang=pt_br&units=metric`
      );
      setWeather(resp.data);
    } catch (err) {
      console.error('Erro ao buscar informações da cidade:', err);
      setError('Cidade não encontrada. Tente novamente.');
      setWeather(undefined);
    } finally {
      setLoading(false);
    }
  }

  function selectSuggestion(s) {
    setInputValue(s.name);
    setSuggestions([]);
    setShowSuggestions(false);
    searchByCoords(s.lat, s.lon);
  }

  function selectNearbyCity(city) {
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
    <div className={`app-container ${theme}`}>
      <div className="weather-particles">
        {(theme === 'rainy' || theme === 'stormy') &&
          Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="raindrop"
              style={{
                left: `${(i * 2.1) % 100}%`,
                animationDelay: `${(i * 0.13) % 2}s`,
                animationDuration: `${0.5 + (i % 5) * 0.1}s`,
              }}
            />
          ))}
        {theme === 'snowy' &&
          Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="snowflake"
              style={{
                left: `${(i * 1.7) % 100}%`,
                animationDelay: `${(i * 0.3) % 5}s`,
                animationDuration: `${3 + (i % 5)}s`,
                width: `${4 + (i % 4) * 2}px`,
                height: `${4 + (i % 4) * 2}px`,
              }}
            />
          ))}
        {theme === 'cloudy' &&
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="cloud"
              style={{
                top: `${10 + i * 18}%`,
                width: `${150 + (i % 3) * 80}px`,
                height: `${80 + (i % 3) * 40}px`,
                animationDuration: `${20 + i * 8}s`,
                animationDelay: `${i * 4}s`,
              }}
            />
          ))}
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
                      {s.state ? `${s.state}, ` : ''}
                      {s.country}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

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

        {weather && !loading && <WeatherInformations weather={weather} />}
      </div>
    </div>
  );
}

export default App;
