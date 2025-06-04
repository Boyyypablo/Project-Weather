import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './dailyForecast.css';

function DailyForecast({ forecast, dayIndex, onNext, onPrev }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const id = setTimeout(() => setAnimate(false), 500);
    return () => clearTimeout(id);
  }, [dayIndex]);

  if (!forecast || !forecast[dayIndex]) return null;
  const day = forecast[dayIndex];

  return (
    <div className={`forecast-container ${animate ? 'fade' : ''}`}>
      <h2>Previsão para {day.date}</h2>
      <img src={`http://openweathermap.org/img/wn/${day.icon}@2x.png`} alt="" />
      <p>{Math.round(day.temp)}ºC - {day.description}</p>
      <div className="navigation">
        <button onClick={onPrev} disabled={dayIndex === 0}>Anterior</button>
        <button onClick={onNext} disabled={dayIndex === forecast.length - 1}>Próximo</button>
      </div>
    </div>
  );
}

DailyForecast.propTypes = {
  forecast: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      temp: PropTypes.number.isRequired,
      description: PropTypes.string.isRequired,
    })
  ).isRequired,
  dayIndex: PropTypes.number.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
};

export default DailyForecast;
