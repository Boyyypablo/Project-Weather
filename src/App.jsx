import { useState, useRef} from 'react'
import axios from 'axios'
import './App.css'
import WeatherInformations from './components/WeatherInformations/WeatherInformations'
function App() {
  const [Weather, setWeather] = useState ({})
  const inputRef = useRef() 
  async function searchCity(){
    const city = inputRef.current.value 
    
    const key = `71bdaaed1643cbb91fadf3068faf912c`
    
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&lang=pt_br$units=metric`
  
    const apiinfo = await axios.get(url)

   
    setWeather (apiinfo.data)
    console.log(apiinfo.data)
     } 

  return (
    <div>
    <h1> Previsão do tempo </h1>
    <input ref={inputRef} type="text" placeholder='Digite o nome da cidade' />
    <button onClick={searchCity}>Buscar</button>
    <WeatherInformations />
    </div>
  )
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
export default App
