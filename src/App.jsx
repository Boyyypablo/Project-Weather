import { useState, useRef} from 'react'
import './App.css'
import axios from 'axios'
function App() {
  const [count, setCount] = useState(0)
  const inputRef = useRef()
  
  async function searchCity(){
    console.log(inputRef.current.value)
    const city = inputRef.current.value 
    const key = `71bdaaed1643cbb91fadf3068faf912c`
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&lang={pt_br}$units=metric`
  
    const data = await axios.get(url)

console.log(data)
a
  } 

  return (
    <div>
    <h1> Previsão do tempo </h1>
    <input ref={inputRef} type="text" placeholder='Digite o nome da cidade' />
    <button onClick={searchCity}>Buscar</button>
    </div>
  )
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
export default App
