import './WeatherInformations.css';
import { resolveScene } from '../../utils/weatherScene';

const RAIN_DROPS = [6, 14, 22, 31, 39, 48, 57, 66, 74, 83, 91];
const SNOW_FLAKES = [8, 18, 28, 40, 52, 63, 74, 86];
const STARS = [12, 22, 38, 55, 70, 84];

function WeatherInformations({ weather, forecast = [] }) {
  const scene = resolveScene(weather);
  const current = Math.round(weather.main.temp);
  const min = Math.round(weather.main.temp_min);
  const max = Math.round(weather.main.temp_max);
  const showRange = min !== current || max !== current;
  const description = weather.weather[0].description;

  return (
    <article className="weather-card">
      <p className="weather-city">
        {weather.name}, {weather.sys.country}
      </p>

      <div className="weather-hero">
        <div className="weather-readout">
          <p className="weather-temp">
            {current}
            <span>°C</span>
          </p>
          {showRange && (
            <p className="weather-range">
              <span>mín {min}°</span>
              <span aria-hidden="true">·</span>
              <span>máx {max}°</span>
            </p>
          )}
          <p className="weather-description">{description}</p>
        </div>
        <SkyScene scene={scene} />
      </div>

      <div className="weather-details">
        <div className="weather-detail-item">
          <ThermometerIcon />
          <p className="weather-detail-label">Sensação</p>
          <p className="weather-detail-value">
            {Math.round(weather.main.feels_like)}°C
          </p>
        </div>
        <div className="weather-detail-item">
          <DropIcon />
          <p className="weather-detail-label">Umidade</p>
          <p className="weather-detail-value">{weather.main.humidity}%</p>
        </div>
        <div className="weather-detail-item">
          <GaugeIcon />
          <p className="weather-detail-label">Pressão</p>
          <p className="weather-detail-value">
            {weather.main.pressure}
            <span className="weather-detail-unit"> hPa</span>
          </p>
        </div>
      </div>

      {forecast.length > 0 && (
        <section className="forecast" aria-label="Previsão dos próximos dias">
          <p className="forecast-title">Próximos dias</p>
          <ul className="forecast-list">
            {forecast.map((day) => (
              <li key={day.date} className="forecast-row">
                <span className="forecast-day">{day.label}</span>
                <img
                  className="forecast-icon"
                  src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                  alt=""
                />
                <span className="forecast-desc">
                  {day.description}
                  {day.pop > 0 && (
                    <span className="forecast-pop"> {day.pop}%</span>
                  )}
                </span>
                <span className="forecast-temps">
                  <span className="forecast-max">{day.max}°</span>
                  <span className="forecast-min">{day.min}°</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function SkyScene({ scene }) {
  return (
    <div className={`sky-scene scene-${scene}`} aria-hidden="true">
      {(scene === 'clear' || scene === 'partly') && (
        <div className="sun">
          <div className="sun-rays" />
          <div className="sun-core" />
        </div>
      )}

      {scene === 'night' && (
        <>
          <div className="moon" />
          {STARS.map((left, index) => (
            <span
              key={left}
              className="scene-star"
              style={{
                left: `${left}%`,
                top: `${18 + ((index * 17) % 48)}%`,
                animationDelay: `${index * 0.45}s`,
              }}
            />
          ))}
        </>
      )}

      {(scene === 'partly' || scene === 'cloudy' || scene === 'rain' || scene === 'storm') && (
        <div className={`cloud ${scene === 'partly' ? 'cloud-pass' : 'cloud-still'}`}>
          <span />
          <span />
          <span />
        </div>
      )}

      {(scene === 'cloudy' || scene === 'rain' || scene === 'storm') && (
        <div className="cloud cloud-back">
          <span />
          <span />
          <span />
        </div>
      )}

      {(scene === 'rain' || scene === 'storm') &&
        RAIN_DROPS.map((left, index) => (
          <span
            key={left}
            className="scene-drop"
            style={{
              left: `${left}%`,
              animationDelay: `${(index * 0.13) % 0.9}s`,
              animationDuration: `${0.7 + (index % 3) * 0.15}s`,
            }}
          />
        ))}

      {scene === 'storm' && <div className="lightning" />}

      {scene === 'snow' &&
        SNOW_FLAKES.map((left, index) => (
          <span
            key={left}
            className={`scene-flake ${index % 2 === 0 ? 'flake-lg' : 'flake-sm'}`}
            style={{
              left: `${left}%`,
              animationDelay: `${index * 0.4}s`,
            }}
          />
        ))}

      {scene === 'mist' && (
        <>
          <div className="fog fog-a" />
          <div className="fog fog-b" />
        </>
      )}
    </div>
  );
}

function ThermometerIcon() {
  return (
    <svg className="weather-detail-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 14.2V5.5a2 2 0 1 1 4 0v8.7a3.5 3.5 0 1 1-4 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M12 14.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DropIcon() {
  return (
    <svg className="weather-detail-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.5s6 6.2 6 10.2a6 6 0 0 1-12 0c0-4 6-10.2 6-10.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GaugeIcon() {
  return (
    <svg className="weather-detail-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 16.5a8 8 0 1 1 14 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M12 16.5 16 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default WeatherInformations;
