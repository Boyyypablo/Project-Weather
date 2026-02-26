import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import WeatherInformations from './components/WeatherInformations/WeatherInformations';

function App() {
  const [weather, setWeather] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const inputRef = useRef();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function searchCity() {
    const city = inputRef.current.value.trim();
    if (!city) return;

    setLoading(true);
    setError('');

    const key = '71bdaaed1643cbb91fadf3068faf912c';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&lang=pt_br&units=metric`;

    try {
      const apiinfo = await axios.get(url);
      setWeather(apiinfo.data);
    } catch (err) {
      console.error('Erro ao buscar informações da cidade:', err);
      setError('Cidade não encontrada. Tente novamente.');
      setWeather(undefined);
    } finally {
      setLoading(false);
    }
  }

  function getWeatherTheme() {
    if (!weather) return 'default';
    const temp = weather.main.temp;
    const condition = weather.weather[0].main.toLowerCase();

    if (condition.includes('thunder')) return 'stormy';
    if (condition.includes('rain') || condition.includes('drizzle')) return 'rainy';
    if (condition.includes('snow')) return 'snowy';
    if (condition.includes('cloud')) return 'cloudy';
    if (condition.includes('mist') || condition.includes('fog') || condition.includes('haze')) return 'misty';
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

        <div className="search-container">
          <input
            ref={inputRef}
            type="text"
            placeholder="Digite o nome da cidade"
            className="search-input"
            onKeyDown={(e) => e.key === 'Enter' && searchCity()}
          />
          <button onClick={searchCity} className="search-button">
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
            Buscar
          </button>
        </div>

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
