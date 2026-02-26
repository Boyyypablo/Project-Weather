import './WeatherInformations.css';

function WeatherInformations({ weather }) {
  return (
    <div className="weather-card">
      <p className="weather-city">
        {weather.name}, {weather.sys.country}
      </p>

      <div className="weather-main">
        <img
          className="weather-icon"
          src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
          alt={weather.weather[0].description}
        />
        <p className="weather-temp">
          {Math.round(weather.main.temp)}
          <span>°C</span>
        </p>
      </div>

      <p className="weather-description">{weather.weather[0].description}</p>

      <div className="weather-details">
        <div className="weather-detail-item">
          <p className="weather-detail-label">Sensação</p>
          <p className="weather-detail-value">
            {Math.round(weather.main.feels_like)}°C
          </p>
        </div>
        <div className="weather-detail-item">
          <p className="weather-detail-label">Umidade</p>
          <p className="weather-detail-value">{weather.main.humidity}%</p>
        </div>
        <div className="weather-detail-item">
          <p className="weather-detail-label">Pressão</p>
          <p className="weather-detail-value">{weather.main.pressure} hPa</p>
        </div>
      </div>
    </div>
  );
}

export default WeatherInformations;
