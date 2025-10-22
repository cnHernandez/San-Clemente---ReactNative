import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ScrollView,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// Datos de las atracciones con imágenes reales
const attractions = [
  {
    name: 'Mundo Marino',
    description: 'El oceanario más grande de Sudamérica.',
    image: require('@/assets/mundo-marino.jpg'),
    url: 'https://www.tripadvisor.com.ar/Attraction_Review-g312757-d1378678-Reviews-Mundo_Marino-San_Clemente_del_Tuyu_Province_of_Buenos_Aires_Central_Argentina.html'
  },
  {
    name: 'Termas Marinas',
    description: 'Un parque termal con diversas piscinas y actividades.',
    image: require('@/assets/termasMarinasPark.jpg'),
    url: 'https://www.tripadvisor.com.ar/Attraction_Review-g312757-d2358887-Reviews-Termas_Marinas_Park-San_Clemente_del_Tuyu_Province_of_Buenos_Aires_Central_Argent.html'
  },
  {
    name: 'Parque Municipal Vivero Cosme Argerich',
    description: 'Un hermoso parque con una gran variedad de flora.',
    image: require('@/assets/parqueMunicipal.jpg'),
    url: 'https://www.tripadvisor.com.ar/Attraction_Review-g312757-d3929015-Reviews-Parque_Municipal_Vivero_Cosme_Argerich-San_Clemente_del_Tuyu_Province_of_Buenos_A.html'
  },
  {
    name: 'Tapera de López',
    description: 'Un sitio histórico con vistas impresionantes.',
    image: require('@/assets/lopez.jpg'),
    url: 'https://www.tripadvisor.com.ar/Attraction_Review-g312757-d2359518-Reviews-Tapera_de_Lopez-San_Clemente_del_Tuyu_Province_of_Buenos_Aires_Central_Argentina.html'
  },
  {
    name: 'Vadinho',
    description: 'Un lugar para disfrutar de la gastronomía local.',
    image: require('@/assets/vadinho.jpg'),
    url: 'https://www.tripadvisor.com.ar/Attraction_Review-g312757-d3935820-Reviews-Vadinho-San_Clemente_del_Tuyu_Province_of_Buenos_Aires_Central_Argentina.html'
  },
  {
    name: 'Punta Rasa',
    description: 'Un lugar ideal para el avistamiento de aves.',
    image: require('@/assets/puntaRasa.jpg'),
    url: 'https://www.tripadvisor.com.ar/Attraction_Review-g312757-d2367557-Reviews-Punta_Rasa-San_Clemente_del_Tuyu_Province_of_Buenos_Aires_Central_Argentina.html'
  },
  {
    name: 'Puerto',
    description: 'El puerto de San Clemente.',
    image: require('@/assets/Puerto.jpg'),
    url: 'https://www.tripadvisor.com.ar/Attraction_Review-g312757-d3929018-Reviews-Puerto_de_San_Clemente_del_Tuyu-San_Clemente_del_Tuyu_Province_of_Buenos_Aires_Ce.html'
  },
  {
    name: 'Costa Maluco',
    description: 'Un balneario con excelentes servicios.',
    image: require('@/assets/costaMaluco.jpg'),
    url: 'https://www.tripadvisor.com.ar/Attraction_Review-g312757-d9789387-Reviews-Balneario_Costa_Maluco-San_Clemente_del_Tuyu_Province_of_Buenos_Aires_Central_Arg.html'
  },
];

const Attractions = () => {
  const openURL = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Error al abrir URL:', err));
  };

  const renderAttractionCard = (attraction: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.card}
      onPress={() => openURL(attraction.url)}
    >
      <Image source={attraction.image} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{attraction.name}</Text>
        <Text style={styles.cardDescription}>{attraction.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Atracciones</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {attractions.map((attraction, index) => renderAttractionCard(attraction, index))}
      </ScrollView>
      
      {/* Grid alternativo para pantallas más grandes */}
      <View style={styles.gridContainer}>
        {attractions.map((attraction, index) => renderAttractionCard(attraction, index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  scrollContainer: {
    paddingHorizontal: 10,
    display: width < 768 ? 'flex' : 'none', // Mostrar scroll horizontal en móviles
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    display: width >= 768 ? 'flex' : 'none', // Mostrar grid en pantallas más grandes
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginRight: 15,
    marginBottom: 15,
    width: width < 768 ? 250 : (width - 60) / 2, // Responsive width
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default Attractions;