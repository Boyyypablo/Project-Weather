import { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';
import WeatherInformations from './components/WeatherInformations/WeatherInformations';
import DailyForecast from './components/DailyForecast/DailyForecast';

function App() {
  const [weather, setWeather] = useState();
  const [forecast, setForecast] = useState([]);
  const [dayIndex, setDayIndex] = useState(0);
  const inputRef = useRef();

  async function searchCity() {
    const city = inputRef.current.value;
    const key = `71bdaaed1643cbb91fadf3068faf912c`;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&lang=pt_br&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${key}&lang=pt_br&units=metric`;

    try {
      const apiinfo = await axios.get(url);
      setWeather(apiinfo.data);
      const forecastInfo = await axios.get(forecastUrl);
      const dailyData = forecastInfo.data.list
        .filter((item) => item.dt_txt.includes('12:00:00'))
        .slice(0, 5)
        .map((item) => ({
          date: new Date(item.dt_txt).toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
          temp: item.main.temp,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
        }));
      setForecast(dailyData);
      setDayIndex(0);
      console.log(apiinfo.data);
    } catch (error) {
      console.error("Erro ao buscar informações da cidade:", error);
    }
  }

  const handleNextDay = () => {
    setDayIndex((index) => Math.min(index + 1, forecast.length - 1));
  };

  const handlePrevDay = () => {
    setDayIndex((index) => Math.max(index - 1, 0));
  };

  return (
    <div>
      <h1>Previsão do tempo</h1>
      <input ref={inputRef} type="text" placeholder="Digite o nome da cidade" />
      <button onClick={searchCity}>Buscar</button>
      {weather && <WeatherInformations weather={weather} />}
      {forecast.length > 0 && (
        <DailyForecast
          forecast={forecast}
          dayIndex={dayIndex}
          onNext={handleNextDay}
          onPrev={handlePrevDay}
        />
      )}
    </div>
  );
}

export default App;
