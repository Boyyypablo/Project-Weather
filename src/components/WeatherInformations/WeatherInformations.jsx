import PropTypes from 'prop-types';

function WeatherInformations({ weather }) {
    console.log(weather);

    return (
        <div>
            <h2>Informações do Tempo</h2>
            <div>
                <img src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} alt="Weather Icon" />
                <p>{Math.round(weather.main.temp)}ºC</p>
            </div>
            <p>{weather.weather[0].description}</p>
            <div>
                <p>Sensação térmica: {Math.round(weather.main.feels_like)}ºC</p>
                <p>Umidade: {weather.main.humidity}%</p>
                <p>Pressão: {weather.main.pressure}</p>
            </div>
        </div>
    );
}

WeatherInformations.propTypes = {
    weather: PropTypes.shape({
        weather: PropTypes.arrayOf(
            PropTypes.shape({
                icon: PropTypes.string.isRequired,
                description: PropTypes.string.isRequired,
            })
        ),
        main: PropTypes.shape({
            temp: PropTypes.number.isRequired,
            feels_like: PropTypes.number.isRequired,
            humidity: PropTypes.number.isRequired,
            pressure: PropTypes.number.isRequired,
        }),
    }).isRequired,
};

export default WeatherInformations;
