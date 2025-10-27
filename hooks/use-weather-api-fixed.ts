import { useState } from 'react';

// Configuración de la API
const WEATHER_API_KEY = '79f45cfe78cdb7cda4964c918b99a004'; // Tu API key de OpenWeatherMap ACTIVA
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Coordenadas de San Clemente del Tuyú
const SAN_CLEMENTE_COORDS = {
  lat: -36.3561,
  lon: -56.7250
};

interface WeatherData {
  location: string;
  current: {
    temp: number;
    condition: string;
    humidity: number;
    wind: number;
    description: string;
  };
  dates: string;
}

export const useWeatherAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Cache para evitar llamadas múltiples
  const [weatherCache, setWeatherCache] = useState<{[key: string]: WeatherData}>({});

  const getWeatherIcon = (iconCode: string): string => {
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', '01n': '🌙',
      '02d': '🌤️', '02n': '☁️', 
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️',
    };
    return iconMap[iconCode] || '🌤️';
  };

  const generateFallbackWeather = (startDate: string, endDate: string): WeatherData => {
    const temps = [18, 19, 20, 21, 22, 23, 24, 25, 26];
    const conditions = ['☀️ Soleado', '⛅ Parcialmente nublado', '☁️ Nublado', '🌤️ Despejado'];
    
    return {
      location: 'San Clemente del Tuyú, Buenos Aires (Datos simulados)',
      current: {
        temp: temps[Math.floor(Math.random() * temps.length)],
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        humidity: Math.floor(50 + Math.random() * 30),
        wind: Math.floor(5 + Math.random() * 20),
        description: 'Datos no disponibles'
      },
      dates: `${startDate} al ${endDate}`
    };
  };

  const fetchCurrentWeather = async (startDate: string, endDate: string): Promise<WeatherData> => {
    // Evitar llamadas muy frecuentes (mínimo 5 segundos entre llamadas)
    const now = Date.now();
    const cacheKey = `${startDate}-${endDate}`;
    
    if (now - lastFetchTime < 5000) {
      console.log('🔄 Evitando llamada muy frecuente, usando cache...');
      if (weatherCache[cacheKey]) {
        return weatherCache[cacheKey];
      }
      return generateFallbackWeather(startDate, endDate);
    }

    setLastFetchTime(now);
    
    if (!startDate || !endDate || startDate.length < 10 || endDate.length < 10) {
      const fallback = generateFallbackWeather(startDate, endDate);
      setWeatherCache({...weatherCache, [cacheKey]: fallback});
      return fallback;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🌤️ Intentando obtener clima real...');
      
      // Verificar primero si la API está disponible con un timeout corto
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch(
        `${WEATHER_BASE_URL}/weather?lat=${SAN_CLEMENTE_COORDS.lat}&lon=${SAN_CLEMENTE_COORDS.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API Key inválida o no activada');
        }
        throw new Error(`Error de API: ${response.status}`);
      }

      const data = await response.json();

      const weatherData: WeatherData = {
        location: 'San Clemente del Tuyú, Buenos Aires',
        current: {
          temp: Math.round(data.main.temp),
          condition: `${getWeatherIcon(data.weather[0].icon)} ${data.weather[0].main}`,
          humidity: data.main.humidity,
          wind: Math.round(data.wind?.speed * 3.6 || 0),
          description: data.weather[0].description
        },
        dates: `${startDate} al ${endDate}`
      };

      console.log('✅ Clima real obtenido exitosamente!');
      setWeatherCache({...weatherCache, [cacheKey]: weatherData});
      return weatherData;

    } catch (err) {
      console.log('⚠️ Error de API, usando datos simulados:', err);
      setError('API no disponible, mostrando datos simulados');
      
      const fallbackData = generateFallbackWeather(startDate, endDate);
      setWeatherCache({...weatherCache, [cacheKey]: fallbackData});
      return fallbackData;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchCurrentWeather,
    isLoading,
    error
  };
};