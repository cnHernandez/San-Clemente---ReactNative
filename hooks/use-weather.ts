import { useState, useCallback } from 'react';

export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    humidity: number;
    wind_kph: number;
    feelslike_c: number;
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        condition: {
          text: string;
          icon: string;
        };
        daily_chance_of_rain: number;
      };
    }>;
  };
}

export interface WeatherError {
  message: string;
  code?: string;
}

const useWeather = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<WeatherError | null>(null);

  // Generar datos de pronóstico simulados para Android
  const generateMockForecast = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = [];
    
    const conditions = [
      { text: 'Soleado', icon: '☀️' },
      { text: 'Parcialmente nublado', icon: '⛅' },
      { text: 'Nublado', icon: '☁️' },
      { text: 'Lluvia ligera', icon: '🌦️' },
      { text: 'Despejado', icon: '🌤️' }
    ];

    const currentDate = new Date(start);
    let dayCount = 0;
    
    while (currentDate <= end && dayCount < 10) { // Máximo 10 días
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      days.push({
        date: currentDate.toISOString().split('T')[0],
        day: {
          maxtemp_c: Math.round(18 + Math.random() * 12), // Entre 18°C y 30°C
          mintemp_c: Math.round(10 + Math.random() * 8),  // Entre 10°C y 18°C
          condition: condition,
          daily_chance_of_rain: Math.round(Math.random() * 100)
        }
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
      dayCount++;
    }
    
    return days;
  }, []);

  // Función para obtener el clima actual (versión simplificada para Android)
  const getCurrentWeather = useCallback(async (location: string = 'San Clemente del Tuyú, Buenos Aires') => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Para Android, usamos datos simulados directamente
      console.log('🌤️ Generando clima para:', location);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockWeatherData: WeatherData = {
        location: {
          name: 'San Clemente del Tuyú',
          region: 'Buenos Aires',
          country: 'Argentina',
          localtime: new Date().toLocaleString('es-AR')
        },
        current: {
          temp_c: Math.round(18 + Math.random() * 10), // Temperatura entre 18-28°C
          condition: {
            text: 'Soleado',
            icon: '☀️'
          },
          humidity: Math.round(50 + Math.random() * 30), // Humedad 50-80%
          wind_kph: Math.round(5 + Math.random() * 20), // Viento 5-25 km/h
          feelslike_c: Math.round(20 + Math.random() * 8)
        }
      };
      
      setWeatherData(mockWeatherData);
      console.log('✅ Clima cargado exitosamente');
    } catch (err: any) {
      console.error('❌ Error en clima:', err);
      setError({
        message: 'Error al cargar el clima',
        code: 'LOAD_ERROR'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para obtener el pronóstico por fechas (optimizada para Android)
  const getForecastWeather = useCallback(async (
    startDate: string, 
    endDate: string, 
    location: string = 'San Clemente del Tuyú, Buenos Aires'
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📅 Generando pronóstico desde', startDate, 'hasta', endDate);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockForecastData: WeatherData = {
        location: {
          name: 'San Clemente del Tuyú',
          region: 'Buenos Aires',
          country: 'Argentina',
          localtime: new Date().toLocaleString('es-AR')
        },
        current: {
          temp_c: Math.round(20 + Math.random() * 8),
          condition: {
            text: 'Agradable',
            icon: '🌤️'
          },
          humidity: Math.round(60 + Math.random() * 20),
          wind_kph: Math.round(10 + Math.random() * 15),
          feelslike_c: Math.round(22 + Math.random() * 6)
        },
        forecast: {
          forecastday: generateMockForecast(startDate, endDate)
        }
      };
      
      setWeatherData(mockForecastData);
      console.log('✅ Pronóstico cargado exitosamente');
    } catch (err: any) {
      console.error('❌ Error en pronóstico:', err);
      setError({
        message: 'Error al cargar el pronóstico',
        code: 'FORECAST_ERROR'
      });
    } finally {
      setIsLoading(false);
    }
  }, [generateMockForecast]);

  // Función para limpiar datos
  const clearWeatherData = useCallback(() => {
    setWeatherData(null);
    setError(null);
    console.log('🧹 Datos de clima limpiados');
  }, []);

  return {
    weatherData,
    isLoading,
    error,
    getCurrentWeather,
    getForecastWeather,
    clearWeatherData
  };
};

export default useWeather;