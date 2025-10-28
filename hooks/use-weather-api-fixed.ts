import { useState } from 'react';

// Configuración de la API
const WEATHER_API_KEY = '79f45cfe78cdb7cda4964c918b99a004'; // Tu API key de OpenWeatherMap ACTIVA
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Coordenadas de San Clemente del Tuyú
const SAN_CLEMENTE_COORDS = {
  lat: -36.3561,
  lon: -56.7250
};

export interface ForecastDay {
  date: string;
  day: string;
  temp_max: number;
  temp_min: number;
  condition: string;
  icon: string;
  humidity: number;
  wind: number;
  description: string;
}

interface WeatherData {
  location: string;
  current: {
    temp: number;
    condition: string;
    humidity: number;
    wind: number;
    description: string;
  };
  forecast: Array<ForecastDay>;
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

  // Función para generar rango de fechas
  const generateDateRange = (startDate: string, endDate: string): string[] => {
    const dates: string[] = [];
    const [startDay, startMonth, startYear] = startDate.split('/');
    const [endDay, endMonth, endYear] = endDate.split('/');
    
    const start = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
    const end = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));
    
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDate().toString().padStart(2, '0');
      const month = (current.getMonth() + 1).toString().padStart(2, '0');
      const year = current.getFullYear().toString();
      dates.push(`${day}/${month}/${year}`);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // Función para obtener nombre del día
  const getDayName = (dateString: string): string => {
    const [day, month, year] = dateString.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  };

  const generateFallbackWeather = (startDate: string, endDate: string): WeatherData => {
    const temps = [18, 19, 20, 21, 22, 23, 24, 25, 26];
    const conditions = ['☀️ Soleado', '⛅ Parcialmente nublado', '☁️ Nublado', '🌤️ Despejado'];
    
    // Generar pronóstico para los días del rango
    const forecast = generateDateRange(startDate, endDate).map((date, index) => {
      const tempMax = temps[Math.floor(Math.random() * temps.length)];
      const tempMin = tempMax - Math.floor(Math.random() * 8 + 3); // 3-10°C menor
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      return {
        date: date,
        day: getDayName(date),
        temp_max: tempMax,
        temp_min: tempMin,
        condition: condition,
        icon: condition.includes('☀️') ? '☀️' : condition.includes('⛅') ? '⛅' : condition.includes('☁️') ? '☁️' : '🌤️',
        humidity: Math.floor(50 + Math.random() * 30),
        wind: Math.floor(5 + Math.random() * 20),
        description: 'Datos simulados'
      };
    });
    
    return {
      location: 'San Clemente del Tuyú, Buenos Aires (Datos simulados)',
      current: {
        temp: forecast[0]?.temp_max || temps[Math.floor(Math.random() * temps.length)],
        condition: forecast[0]?.condition || conditions[Math.floor(Math.random() * conditions.length)],
        humidity: Math.floor(50 + Math.random() * 30),
        wind: Math.floor(5 + Math.random() * 20),
        description: 'Datos no disponibles'
      },
      forecast: forecast,
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

      // Obtener pronóstico de 5 días
      let forecastData: Array<{
        date: string;
        day: string;
        temp_max: number;
        temp_min: number;
        condition: string;
        icon: string;
        humidity: number;
        wind: number;
        description: string;
      }> = [];
      try {
        const forecastResponse = await fetch(
          `${WEATHER_BASE_URL}/forecast?lat=${SAN_CLEMENTE_COORDS.lat}&lon=${SAN_CLEMENTE_COORDS.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`,
          { signal: controller.signal }
        );

        if (forecastResponse.ok) {
          const forecast = await forecastResponse.json();
          
          // Agrupar por días y crear pronóstico
          const dateRange = generateDateRange(startDate, endDate);
          forecastData = dateRange.map(date => {
            // Buscar datos para este día en el pronóstico
            const dayData = forecast.list.find((item: any) => {
              const itemDate = new Date(item.dt * 1000);
              const [day, month, year] = date.split('/');
              const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              return itemDate.getDate() === targetDate.getDate() && 
                     itemDate.getMonth() === targetDate.getMonth();
            });

            if (dayData) {
              return {
                date: date,
                day: getDayName(date),
                temp_max: Math.round(dayData.main.temp_max),
                temp_min: Math.round(dayData.main.temp_min),
                condition: `${getWeatherIcon(dayData.weather[0].icon)} ${dayData.weather[0].main}`,
                icon: getWeatherIcon(dayData.weather[0].icon),
                humidity: dayData.main.humidity,
                wind: Math.round(dayData.wind?.speed * 3.6 || 0),
                description: dayData.weather[0].description
              };
            } else {
              // Fallback si no hay datos para este día
              return {
                date: date,
                day: getDayName(date),
                temp_max: Math.round(data.main.temp_max || data.main.temp + 3),
                temp_min: Math.round(data.main.temp_min || data.main.temp - 3),
                condition: `${getWeatherIcon(data.weather[0].icon)} ${data.weather[0].main}`,
                icon: getWeatherIcon(data.weather[0].icon),
                humidity: data.main.humidity,
                wind: Math.round(data.wind?.speed * 3.6 || 0),
                description: data.weather[0].description
              };
            }
          });
        }
      } catch (forecastErr) {
        console.log('⚠️ Error obteniendo pronóstico, usando datos básicos');
        const dateRange = generateDateRange(startDate, endDate);
        forecastData = dateRange.map(date => ({
          date: date,
          day: getDayName(date),
          temp_max: Math.round(data.main.temp + Math.random() * 4 - 2),
          temp_min: Math.round(data.main.temp - Math.random() * 6 - 2),
          condition: `${getWeatherIcon(data.weather[0].icon)} ${data.weather[0].main}`,
          icon: getWeatherIcon(data.weather[0].icon),
          humidity: data.main.humidity,
          wind: Math.round(data.wind?.speed * 3.6 || 0),
          description: data.weather[0].description
        }));
      }

      const weatherData: WeatherData = {
        location: 'San Clemente del Tuyú, Buenos Aires',
        current: {
          temp: Math.round(data.main.temp),
          condition: `${getWeatherIcon(data.weather[0].icon)} ${data.weather[0].main}`,
          humidity: data.main.humidity,
          wind: Math.round(data.wind?.speed * 3.6 || 0),
          description: data.weather[0].description
        },
        forecast: forecastData,
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