import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Share2, Heart, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const Blog = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="p-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/01b5bf86-f2e7-42cd-9465-4d0bb347d2ea.png" 
              alt="Statsor" 
              className="h-12 w-auto"
            />
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al inicio</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
              El Blog de Statsor
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Descubre las historias, insights y el futuro del fútbol digital
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Blog Post */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Article Header */}
            <div className="relative h-64 md:h-80 bg-gradient-to-r from-green-600 to-blue-600">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex items-center space-x-4 mb-4">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                    Historia
                  </span>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>15 de Enero, 2024</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>8 min de lectura</span>
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                  ¿Por qué creamos Statsor? La revolución del fútbol digital
                </h1>
              </div>
            </div>

            {/* Article Content */}
            <div className="p-8 md:p-12">
              {/* Author Info */}
              <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Equipo Statsor</h3>
                  <p className="text-gray-600 text-sm">Fundadores y desarrolladores</p>
                </div>
              </div>

              {/* Article Body */}
              <div className="prose prose-lg max-w-none">
                <p className="text-xl text-gray-700 leading-relaxed mb-8 font-medium">
                  Todo comenzó con una simple observación: los entrenadores de fútbol pasaban más tiempo luchando con hojas de cálculo que analizando el juego que tanto aman.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">El problema que vimos</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Durante años, hemos observado cómo entrenadores talentosos se frustraban con herramientas obsoletas. Cuadernos de papel que se perdían, estadísticas dispersas en múltiples archivos, y la imposibilidad de acceder a datos importantes durante los partidos.
                </p>

                <p className="text-gray-700 leading-relaxed mb-6">
                  Nos dimos cuenta de que el fútbol, siendo el deporte más popular del mundo, se había quedado atrás en términos de tecnología aplicada. Mientras otros deportes adoptaban análisis avanzados y herramientas digitales, el fútbol seguía dependiendo de métodos tradicionales.
                </p>

                <div className="bg-green-50 border-l-4 border-green-500 p-6 my-8 rounded-r-lg">
                  <blockquote className="text-lg italic text-green-800">
                    "El fútbol del futuro será más táctico, más técnico y más inteligente. La tecnología nos ayudará a entender mejor el juego."
                  </blockquote>
                  <cite className="text-green-600 font-semibold mt-2 block">- Arsène Wenger</cite>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Nuestra visión</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Imaginamos un mundo donde cada entrenador, desde las categorías base hasta el fútbol profesional, tenga acceso a herramientas que potencien su conocimiento y pasión por el juego. No se trata de reemplazar la intuición del entrenador, sino de amplificarla con datos precisos y análisis inteligentes.
                </p>

                <p className="text-gray-700 leading-relaxed mb-6">
                  Statsor nació de la convicción de que la tecnología debe ser accesible, intuitiva y, sobre todo, útil. No queríamos crear otra herramienta compleja que requiriera un manual de 200 páginas. Queríamos algo que cualquier entrenador pudiera usar desde el primer día.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">El camino hacia la solución</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Comenzamos entrevistando a decenas de entrenadores de diferentes niveles. Desde entrenadores de equipos juveniles hasta técnicos con experiencia en primera división. Todos compartían frustraciones similares:
                </p>

                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Dificultad para registrar estadísticas durante los partidos</li>
                  <li>Falta de herramientas específicas para fútbol y futsal</li>
                  <li>Imposibilidad de acceder a datos sin conexión a internet</li>
                  <li>Herramientas demasiado complejas o demasiado básicas</li>
                  <li>Costos prohibitivos para clubes pequeños</li>
                </ul>

                <p className="text-gray-700 leading-relaxed mb-6">
                  Con esta información, diseñamos Statsor desde cero, priorizando la simplicidad sin sacrificar la potencia. Cada función fue pensada para resolver un problema real que habíamos identificado en nuestras conversaciones con entrenadores.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Características que marcan la diferencia</h2>
                
                <div className="grid md:grid-cols-2 gap-6 my-8">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-green-800 mb-3">🎯 Específico para fútbol</h3>
                      <p className="text-green-700 text-sm">
                        Diseñado exclusivamente para fútbol 11 y futsal, con acciones y estadísticas específicas para cada modalidad.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-blue-800 mb-3">📱 Funciona sin internet</h3>
                      <p className="text-blue-700 text-sm">
                        Registra datos incluso sin conexión. Perfecto para campos donde la conectividad es limitada.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-purple-800 mb-3">🤖 IA táctica integrada</h3>
                      <p className="text-purple-700 text-sm">
                        Asistente de inteligencia artificial que te ayuda con decisiones tácticas y análisis de rendimiento.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-orange-800 mb-3">💰 Accesible para todos</h3>
                      <p className="text-orange-700 text-sm">
                        Precios justos que permiten a cualquier club, sin importar su presupuesto, acceder a tecnología profesional.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">El impacto que buscamos</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Nuestro objetivo va más allá de crear software. Queremos democratizar el acceso a herramientas de análisis deportivo. Creemos que un entrenador de un club de barrio merece las mismas herramientas que un técnico de primera división.
                </p>

                <p className="text-gray-700 leading-relaxed mb-6">
                  Cada función que desarrollamos, cada actualización que lanzamos, está guiada por una pregunta simple: <strong>"¿Esto realmente ayuda a los entrenadores a ser mejores en lo que hacen?"</strong>
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Mirando hacia el futuro</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Statsor es solo el comienzo. Estamos trabajando en funciones revolucionarias como análisis de video automático, predicciones de lesiones basadas en IA, y herramientas de scouting inteligente.
                </p>

                <p className="text-gray-700 leading-relaxed mb-6">
                  Pero lo más importante es que seguimos escuchando. Cada sugerencia de nuestros usuarios nos ayuda a mejorar. Porque al final del día, Statsor no es solo nuestro producto: es la herramienta de toda la comunidad futbolística.
                </p>

                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-8 rounded-xl my-8 text-center">
                  <h3 className="text-2xl font-bold mb-4">¿Listo para revolucionar tu equipo?</h3>
                  <p className="mb-6 text-green-100">
                    Únete a miles de entrenadores que ya están transformando su forma de trabajar con Statsor.
                  </p>
                  <Link to="/signup">
                    <Button className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-8 py-3">
                      Comenzar gratis
                    </Button>
                  </Link>
                </div>

                <p className="text-gray-700 leading-relaxed mb-6">
                  Gracias por acompañarnos en este viaje. El futuro del fútbol es digital, y estamos emocionados de construirlo junto a ti.
                </p>

                <div className="border-t border-gray-200 pt-6 mt-8">
                  <p className="text-sm text-gray-500 italic">
                    ¿Tienes preguntas sobre Statsor o quieres compartir tu experiencia? Nos encantaría escucharte. 
                    <a href="mailto:hola@statsor.com" className="text-green-600 hover:text-green-700 font-medium"> Contáctanos aquí</a>.
                  </p>
                </div>
              </div>

              {/* Article Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Heart className="w-4 h-4" />
                      <span>Me gusta</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>Comentar</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Share2 className="w-4 h-4" />
                      <span>Compartir</span>
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Publicado el 15 de Enero, 2024
                  </div>
                </div>
              </div>
            </div>
          </motion.article>

          {/* Related Articles */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Artículos relacionados
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-full h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg mb-4"></div>
                  <h3 className="font-bold text-gray-900 mb-2">El futuro del análisis táctico</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Cómo la inteligencia artificial está transformando la forma en que entendemos el fútbol.
                  </p>
                  <span className="text-green-600 text-sm font-medium">Próximamente</span>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-full h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg mb-4"></div>
                  <h3 className="font-bold text-gray-900 mb-2">Casos de éxito: Clubes que transformaron su juego</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Historias reales de equipos que mejoraron su rendimiento usando Statsor.
                  </p>
                  <span className="text-green-600 text-sm font-medium">Próximamente</span>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-full h-32 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg mb-4"></div>
                  <h3 className="font-bold text-gray-900 mb-2">Guía completa: Primeros pasos en Statsor</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Todo lo que necesitas saber para empezar a usar Statsor como un profesional.
                  </p>
                  <span className="text-green-600 text-sm font-medium">Próximamente</span>
                </CardContent>
              </Card>
            </div>
          </motion.section>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              No te pierdas nuestras actualizaciones
            </h2>
            <p className="text-gray-600 mb-8">
              Suscríbete a nuestro newsletter para recibir las últimas noticias, consejos tácticos y actualizaciones de Statsor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <Button className="bg-green-600 hover:bg-green-700 px-6 py-3">
                Suscribirse
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Blog;