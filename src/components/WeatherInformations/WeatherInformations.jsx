function WeatherInformations({ weather }) {  // Corrigido para "weather"
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
//Código funcionando finalmente
export default WeatherInformations;
