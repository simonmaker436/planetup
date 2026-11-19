// ============================================================
// data.js — Contenido fijo de la app (retos, niveles, ánimo)
// Para agregar un reto: copia una línea, cambia los datos y pon
// su imagen en img/3d/<img>.png
// co2 = kg, agua = litros, plastico = gramos (valores aproximados)
// ============================================================

const IMG = id => `img/3d/${id}.png`;

const CATEGORIAS = {
  plastico:  { nombre: 'Plástico',  img: 'termo',     color: '#5AB8FF' },
  agua:      { nombre: 'Agua',      img: 'droplet',   color: '#38D6E8' },
  energia:   { nombre: 'Energía',   img: 'voltage',   color: '#FFC845' },
  movilidad: { nombre: 'Movilidad', img: 'bici',      color: '#A48BFF' },
  residuos:  { nombre: 'Residuos',  img: 'reciclar',  color: '#3DDC84' },
  comida:    { nombre: 'Comida',    img: 'sinCarne',  color: '#FF9A5A' },
  bienestar: { nombre: 'Bienestar', img: 'aireLibre', color: '#7BE07B' },
};

const RETOS = [
  // Plástico
  { id: 'termo',     cat: 'plastico',  pts: 10, co2: 0.08, agua: 3,   plastico: 20, titulo: 'Usa tu termo en vez de una botella plástica',
    info: 'Una botella plástica tarda cientos de años en degradarse. Con un termo evitas una botella cada vez que lo llenas.' },
  { id: 'bolsa',     cat: 'plastico',  pts: 10, co2: 0.03, agua: 0,   plastico: 8,  titulo: 'Lleva tu propia bolsa a la tienda',
    info: 'Una bolsa plástica se usa en promedio 12 minutos. Una de tela puede reemplazar cientos de ellas.' },
  { id: 'pitillo',   cat: 'plastico',  pts: 5,  co2: 0.01, agua: 0,   plastico: 1,  titulo: 'Di no al pitillo hoy',
    info: 'Los pitillos son de los residuos que más llegan al mar porque son livianos y casi nunca se reciclan.' },
  { id: 'empaque',   cat: 'plastico',  pts: 10, co2: 0.05, agua: 0,   plastico: 10, titulo: 'Compra un snack sin empaque plástico',
    info: 'Una fruta trae su propio empaque natural. Elegir snacks sin plástico reduce basura que no se puede reciclar.' },
  { id: 'tupper',    cat: 'plastico',  pts: 15, co2: 0.10, agua: 0,   plastico: 25, titulo: 'Lleva el almuerzo en un recipiente reutilizable',
    info: 'Los empaques de comida para llevar son de icopor o plástico de un solo uso. Tu recipiente dura años.' },
  // Agua
  { id: 'ducha',     cat: 'agua',      pts: 15, co2: 0.30, agua: 40,  plastico: 0,  titulo: 'Báñate en menos de 5 minutos',
    info: 'Cada minuto de ducha gasta cerca de 10 litros de agua. Bajar de 9 a 5 minutos ahorra unos 40 litros.' },
  { id: 'grifo',     cat: 'agua',      pts: 5,  co2: 0.02, agua: 6,   plastico: 0,  titulo: 'Cierra la llave mientras te cepillas',
    info: 'Dejar la llave abierta mientras te cepillas bota hasta 6 litros de agua limpia cada vez.' },
  { id: 'fuga',      cat: 'agua',      pts: 10, co2: 0.05, agua: 20,  plastico: 0,  titulo: 'Revisa si hay fugas de agua en tu casa',
    info: 'Un sanitario o una llave que gotea puede botar miles de litros al mes sin que nadie lo note.' },
  { id: 'reusaAgua', cat: 'agua',      pts: 10, co2: 0.02, agua: 10,  plastico: 0,  titulo: 'Reutiliza agua para regar las plantas',
    info: 'El agua de lavar frutas o la de la lluvia sirve perfecto para las plantas y no gastas agua nueva.' },
  // Energía
  { id: 'luces',     cat: 'energia',   pts: 5,  co2: 0.10, agua: 0,   plastico: 0,  titulo: 'Apaga las luces que no estés usando',
    info: 'La energía que no usas no se tiene que producir. Es el hábito más fácil y suma mucho en un año.' },
  { id: 'cargador',  cat: 'energia',   pts: 5,  co2: 0.05, agua: 0,   plastico: 0,  titulo: 'Desconecta los cargadores que no uses',
    info: 'Los aparatos conectados siguen consumiendo energía aunque no los estés usando. Se llama consumo fantasma.' },
  { id: 'sol',       cat: 'energia',   pts: 15, co2: 1.50, agua: 0,   plastico: 0,  titulo: 'Seca la ropa al sol en vez de secadora',
    info: 'La secadora es de los aparatos que más energía gastan en una casa. El sol lo hace gratis.' },
  { id: 'pantallas', cat: 'energia',   pts: 10, co2: 0.05, agua: 0,   plastico: 0,  titulo: 'Pasa 1 hora sin pantallas',
    info: 'Ahorras energía y le das un descanso a tu mente. Menos pantalla suele significar mejor ánimo y mejor sueño.' },
  { id: 'escaleras', cat: 'energia',   pts: 5,  co2: 0.03, agua: 0,   plastico: 0,  titulo: 'Usa las escaleras en vez del ascensor',
    info: 'Ahorras la energía del ascensor y de paso haces ejercicio. Bueno para el planeta y para ti.' },
  { id: 'wifi',      cat: 'energia',   pts: 5,  co2: 0.05, agua: 0,   plastico: 0,  img: 'luces', titulo: 'Apaga el Wi-Fi en la noche',
    info: 'El router consume energía toda la noche aunque nadie lo use. Apagarlo antes de dormir es un hábito simple que ahorra energía.' },
  // Movilidad
  { id: 'caminar',   cat: 'movilidad', pts: 15, co2: 0.50, agua: 0,   plastico: 0,  titulo: 'Ve caminando a un lugar cercano',
    info: 'Los trayectos cortos en carro son los que más contaminan por kilómetro. Caminar no emite nada.' },
  { id: 'bici',      cat: 'movilidad', pts: 20, co2: 1.20, agua: 0,   plastico: 0,  titulo: 'Muévete en bici hoy',
    info: 'Bogotá tiene una de las redes de ciclorrutas más grandes de Latinoamérica. Cero emisiones y mucha energía.' },
  { id: 'publico',   cat: 'movilidad', pts: 15, co2: 1.00, agua: 0,   plastico: 0,  titulo: 'Usa transporte público en vez de carro',
    info: 'Un bus lleva a decenas de personas con la contaminación de pocos carros. Compartir el viaje lo cambia todo.' },
  { id: 'compartir', cat: 'movilidad', pts: 10, co2: 0.80, agua: 0,   plastico: 0,  titulo: 'Comparte el carro con amigos',
    info: 'Si van cuatro personas en un carro en vez de cuatro carros, la contaminación se divide entre todos.' },
  // Residuos
  { id: 'separar',   cat: 'residuos',  pts: 10, co2: 0.20, agua: 0,   plastico: 5,  titulo: 'Separa la basura: blanca, negra y verde',
    info: 'Blanca para aprovechables, negra para no aprovechables y verde para orgánicos. Así los recicladores pueden recuperar más.' },
  { id: 'reciclar',  cat: 'residuos',  pts: 15, co2: 0.30, agua: 0,   plastico: 30, titulo: 'Lleva plásticos limpios a reciclar',
    info: 'Un plástico sucio casi nunca se recicla. Limpio y separado, puede volver a convertirse en algo nuevo.' },
  { id: 'pilas',     cat: 'residuos',  pts: 15, co2: 0.10, agua: 0,   plastico: 0,  titulo: 'Lleva pilas usadas a un punto de recolección',
    info: 'Una sola pila puede contaminar miles de litros de agua si termina en la basura común.' },
  { id: 'reparar',   cat: 'residuos',  pts: 20, co2: 2.00, agua: 0,   plastico: 15, titulo: 'Repara algo en vez de botarlo',
    info: 'Fabricar algo nuevo gasta mucha más energía que arreglar lo que ya tienes. Reparar es el reciclaje más poderoso.' },
  { id: 'donar',     cat: 'residuos',  pts: 20, co2: 3.00, agua: 0,   plastico: 0,  titulo: 'Dona o intercambia ropa que no uses',
    info: 'Hacer una camiseta nueva gasta unos 2.700 litros de agua. Darle una segunda vida a tu ropa evita eso.' },
  { id: 'hojas',     cat: 'residuos',  pts: 5,  co2: 0.02, agua: 1,   plastico: 0,  titulo: 'Usa las dos caras de las hojas',
    info: 'Usar las dos caras es usar la mitad del papel. Menos papel es menos árboles cortados.' },
  // Comida
  { id: 'sinCarne',  cat: 'comida',    pts: 15, co2: 1.50, agua: 300, plastico: 0,  titulo: 'Haz una comida sin carne',
    info: 'Producir carne de res gasta mucha agua y genera muchos gases. Una comida vegetal de vez en cuando ayuda bastante.' },
  { id: 'plaza',     cat: 'comida',    pts: 10, co2: 0.30, agua: 0,   plastico: 5,  titulo: 'Compra frutas o verduras en la plaza',
    info: 'Los productos locales viajan menos kilómetros y casi no traen empaques. Además apoyas a los campesinos.' },
  { id: 'sobras',    cat: 'comida',    pts: 10, co2: 0.50, agua: 50,  plastico: 0,  titulo: 'No botes comida hoy',
    info: 'Cerca de un tercio de la comida del mundo se bota. Servirte lo justo y guardar las sobras hace la diferencia.' },
  { id: 'compost',   cat: 'comida',    pts: 10, co2: 0.20, agua: 0,   plastico: 0,  titulo: 'Guarda las cáscaras para compost',
    info: 'Las cáscaras en un relleno sanitario generan gases. En compost se convierten en abono para la tierra.' },
  // Bienestar
  { id: 'planta',    cat: 'bienestar', pts: 10, co2: 0.05, agua: 0,   plastico: 0,  titulo: 'Riega o siembra una planta',
    info: 'Las plantas limpian el aire y cuidarlas reduce el estrés. Una pequeña dosis de naturaleza en tu día.' },
  { id: 'aireLibre', cat: 'bienestar', pts: 10, co2: 0.00, agua: 0,   plastico: 0,  titulo: 'Pasa 30 minutos al aire libre',
    info: 'Pasar tiempo en la naturaleza mejora el ánimo y te recuerda por qué vale la pena cuidarla.' },
];

// Puntos totales necesarios para llegar a cada nivel
const NIVELES = [
  { n: 1,  nombre: 'Reciclador Básico',    img: 'compost',  min: 0 },
  { n: 2,  nombre: 'Aprendiz Verde',       img: 'herb',     min: 50 },
  { n: 3,  nombre: 'Cuidador del Agua',    img: 'droplet',  min: 120 },
  { n: 4,  nombre: 'Ahorrador de Energía', img: 'voltage',  min: 220 },
  { n: 5,  nombre: 'Reciclador Pro',       img: 'reciclar', min: 350 },
  { n: 6,  nombre: 'Guardián Verde',       img: 'shield',   min: 520 },
  { n: 7,  nombre: 'Héroe Ecológico',      img: 'star',     min: 730 },
  { n: 8,  nombre: 'Súper Reciclador',     img: 'rocket',   min: 1000 },
  { n: 9,  nombre: 'Maestro del Planeta',  img: 'globe',    min: 1350 },
  { n: 10, nombre: 'Leyenda PlanetUp',     img: 'crown',    min: 1800 },
];

// Ánimo: las caras se dibujan en ui.js (sin emojis)
const ANIMOS = [
  { v: 1, nombre: 'Mal',     color: '#FF6B6B' },
  { v: 2, nombre: 'Regular', color: '#FF9F5A' },
  { v: 3, nombre: 'Normal',  color: '#FFD45A' },
  { v: 4, nombre: 'Bien',    color: '#9BE15D' },
  { v: 5, nombre: 'Genial',  color: '#3DDC84' },
];

// Amigos de demostración para la liga semanal (no hay servidor)
const AMIGOS_DEMO = ['Laura', 'Mateo', 'Sofía', 'Juan', 'Valentina'];

const RETOS_POR_DIA = 5;
