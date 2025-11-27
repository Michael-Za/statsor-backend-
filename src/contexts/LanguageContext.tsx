import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

// Clean translations object with no duplicates
const translations = {
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.pricing': 'Precios',
    'nav.demo': 'Demo',
    'nav.contact': 'Contacto',
    'nav.signin': 'Iniciar Sesión',
    'nav.signup': 'Registrarse',
    'nav.logout': 'Cerrar Sesión',
    'nav.dashboard': 'Panel',

    // Stats
    'general.stats': 'Estadísticas Generales',
    'performance': 'Rendimiento',
    'attack': 'Ataque',
    'defense': 'Defensa',
    'discipline': 'Disciplina',
    'wins': 'Victorias',
    'draws': 'Empates',
    'losses': 'Derrotas',
    'goals.for': 'Goles a Favor',
    'goals.against': 'Goles en Contra',
    'assists.total': 'Asistencias',
    'shots.goal': 'Tiros al Arco',
    'shots.out': 'Tiros Desviados',
    'balls.recovered': 'Balones Recuperados',
    'duels.won': 'Duelos Ganados',
    'saves': 'Atajadas',
    'fouls.committed': 'Faltas Cometidas',
    'fouls.received': 'Faltas Recibidas',
    'yellow.cards': 'Tarjetas Amarillas',
    'red.cards': 'Tarjetas Rojas',
    'performance.trends': 'Tendencias de Rendimiento',
    'position.stats': 'Estadísticas por Posición',
    'stats.no.performance.data': 'No hay datos de rendimiento disponibles aún.',
    'stats.add.matches.for.trends': 'Agrega partidos para ver las tendencias de rendimiento.',
    'stats.no.position.data': 'No hay datos por posición disponibles aún.',
    'stats.add.players.matches.for.stats': 'Agrega jugadores y partidos para ver estadísticas por posición.',

    // Players
    'players.goals': 'Goles',
    'players.assists': 'Asistencias',
    'players.shots.goal': 'Tiros al Arco',
    'players.shots.out': 'Tiros Desviados',
    'players.balls.recovered': 'Balones Recuperados',
    'players.duels.won': 'Duelos Ganados',
    'players.saves': 'Atajadas',
    'players.fouls.committed': 'Faltas Cometidas',
    'players.fouls.received': 'Faltas Recibidas',
    'players.yellow.cards': 'Tarjetas Amarillas',
    'players.red.cards': 'Tarjetas Rojas',
    'players.position': 'Posición',
    'players.number': 'Número',
    'players.age': 'Edad',
    'players.height': 'Altura',
    'players.weight': 'Peso',
    'players.dominant.foot': 'Pierna Dominante',
    'players.join.date': 'Fecha de Ingreso',
    'players.contract.until': 'Contrato Hasta',
    'players.status': 'Estado',
    'players.active': 'Activo',
    'players.injured': 'Lesionado',
    'players.suspended': 'Suspendido',
    'players.rating': 'Calificación',
    'players.notes': 'Notas',

    // Hero section
    'hero.title.digitize': 'Digitaliza tu equipo de fútbol',
    'hero.subtitle': 'Software integral para entrenadores de fútbol que revoluciona la gestión de equipos, estadísticas y entrenamientos',

    // Features
    'features.title': 'Características Principales',
    'features.subtitle': 'Todo lo que necesitas para gestionar tu equipo profesionalmente',
    'features.training.title': 'Gestión de Entrenamientos',
    'features.training.description': 'Planifica y registra entrenamientos con ejercicios personalizados',
    'features.attendance.title': 'Control de Asistencia',
    'features.attendance.description': 'Seguimiento completo de la asistencia de jugadores',
    'features.stats.title': 'Estadísticas Avanzadas',
    'features.stats.description': 'Análisis detallado del rendimiento individual y del equipo',
    'features.reports.title': 'Informes Profesionales',
    'features.reports.description': 'Genera informes detallados y exporta datos fácilmente',

    // Benefits
    'benefits.title': 'Beneficios Clave',
    'benefits.subtitle': 'Descubre por qué Statsor es la mejor opción para tu equipo',
    'benefits.tactile.title': 'Interfaz Táctil',
    'benefits.tactile.description': 'Optimizado para tablets y dispositivos móviles',
    'benefits.analysis.title': 'Análisis Inteligente',
    'benefits.analysis.description': 'IA que te ayuda a tomar mejores decisiones tácticas',
    'benefits.offline.title': 'Funciona Sin Internet',
    'benefits.offline.description': 'Registra datos incluso sin conexión a internet',
    'benefits.reports.title': 'Informes Automáticos',
    'benefits.reports.description': 'Genera informes profesionales automáticamente',

    // Pricing
    'pricing.title': 'Planes de Precios',
    'pricing.subtitle': 'Elige el plan que mejor se adapte a tus necesidades',
    'pricing.monthly': 'Mensual',
    'pricing.annual': 'Anual',
    'pricing.save': 'Ahorra 20%',
    'pricing.starter.title': 'Starter',
    'pricing.starter.price': 'Gratis',
    'pricing.starter.period': 'por mes',
    'pricing.pro.title': 'Pro',
    'pricing.pro.period': 'por mes',
    'pricing.club.title': 'Club',
    'pricing.club.price': 'Personalizado',
    'pricing.club.period': 'por mes',

    // CTA
    'cta.title': '¿Listo para revolucionar tu equipo?',
    'cta.subtitle': 'Únete a miles de entrenadores que ya usan Statsor',
    'cta.button': 'Comenzar Gratis',

    // Testimonials
    'testimonials.title': 'Lo que dicen nuestros usuarios',
    'testimonials.subtitle': 'Testimonios reales de entrenadores profesionales',
    'testimonials.javier.quote': 'Statsor ha transformado completamente la forma en que gestiono mi equipo. Las estadísticas en tiempo real son increíbles.',
    'testimonials.luisa.quote': 'La facilidad de uso y las funciones específicas para futsal han mejorado significativamente nuestro rendimiento.',
    'testimonials.carlos.quote': 'El control de asistencia y la planificación de entrenamientos nos han ahorrado horas de trabajo administrativo.',

    // Search
    'search.placeholder': 'Buscar...',

    // Footer
    'footer.product': 'Producto',
    'footer.resources': 'Recursos',
    'footer.company': 'Empresa',
    'footer.rights': '© 2024 Statsor. Todos los derechos reservados.',
    'footer.privacy': 'Privacidad',
    'footer.terms': 'Términos',

    // Auth
    'auth.signin.title': 'Iniciar Sesión',
    'auth.signin.subtitle': 'Accede a tu cuenta de Statsor',
    'auth.signin.button': 'Iniciar Sesión',
    'auth.signup.title': 'Crear Cuenta',
    'auth.signup.subtitle': 'Únete a la revolución del fútbol digital',
    'auth.signup.button': 'Crear Cuenta',
    'auth.email': 'Email',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar Contraseña',
    'auth.forgot.password': '¿Olvidaste tu contraseña?',
    'auth.no.account': '¿No tienes cuenta?',
    'auth.have.account': '¿Ya tienes cuenta?',
    'auth.signin.link': 'Inicia sesión',
    'auth.signup.link': 'Regístrate',
    'auth.google.button': 'Continuar con Google',

    // Dashboard
    'dashboard.welcome': 'Bienvenido',
    'dashboard.home': 'Inicio',
    'dashboard.points': 'Puntos',
    'dashboard.victories': 'Victorias',
    'dashboard.current.season': 'Temporada Actual',
    'dashboard.add.team': 'Agregar Equipo',
    'dashboard.create.team': 'Crear Nuevo Equipo',
    'dashboard.team.name': 'Nombre del Equipo',
    'dashboard.enter.team.name': 'Ingresa el nombre del equipo',
    'dashboard.cancel': 'Cancelar',
    'dashboard.create.team.button': 'Crear Equipo',
    'dashboard.subscription': 'Suscripción',
    'dashboard.current.plan': 'Plan Actual',
    'dashboard.status': 'Estado',
    'dashboard.manage.subscription': 'Gestionar Suscripción',
    'dashboard.quick.actions': 'Acciones Rápidas',
    'dashboard.add.player': 'Agregar Jugador',
    'dashboard.create.match': 'Crear Partido',
    'dashboard.view.stats': 'Ver Estadísticas',
    'dashboard.recent.activity': 'Actividad Reciente',
    'dashboard.no.activity': 'No hay actividad reciente',
    'dashboard.player.management': 'Gestión de Jugadores',
    'dashboard.tactical.chat': 'Chat Táctico',

    // Sport Selection
    'sport.selection.title': 'Selecciona tu Deporte',
    'sport.selection.subtitle': 'Elige el deporte principal para personalizar tu experiencia',
    'sport.selection.selected': '¡Seleccionado!',
    'sport.selection.confirm': 'Confirmar Selección',
    'sport.soccer': 'Fútbol',
    'sport.futsal': 'Futsal',
    'sport.soccer.description': 'Fútbol tradicional de 11 jugadores',
    'sport.futsal.description': 'Fútbol sala de 5 jugadores',
    'sport.soccer.feature1': 'Gestión de plantillas de hasta 25 jugadores',
    'sport.soccer.feature2': 'Análisis táctico para formaciones 11vs11',
    'sport.soccer.feature3': 'Seguimiento de posiciones específicas',
    'sport.soccer.feature4': 'Estadísticas de partidos completos (90 min)',
    'sport.futsal.feature1': 'Control de rotaciones intensivas',
    'sport.futsal.feature2': 'Análisis de juego en espacio reducido',
    'sport.futsal.feature3': 'Métricas de intensidad y ritmo',
    'sport.futsal.feature4': 'Estadísticas de partidos (40 min)',

    // Goal locations
    'goal.location.title': 'Ubicación del Gol',
    'goal.location.subtitle': 'Selecciona dónde se marcó el gol',
    'goal.location.top.left': 'Arriba Izquierda',
    'goal.location.top.center': 'Arriba Centro',
    'goal.location.top.right': 'Arriba Derecha',
    'goal.location.middle.left': 'Centro Izquierda',
    'goal.location.middle.center': 'Centro',
    'goal.location.middle.right': 'Centro Derecha',
    'goal.location.bottom.left': 'Abajo Izquierda',
    'goal.location.bottom.center': 'Abajo Centro',
    'goal.location.bottom.right': 'Abajo Derecha',
    'goal.location.goal.target': 'Gol',
    'goal.location.cancel': 'Cancelar',

    // Photo upload
    'photo.upload.title': 'Subir Foto',
    'photo.upload.select': 'Seleccionar Foto',
    'photo.upload.selected': 'Seleccionada',
    'photo.upload.size': 'Tamaño',
    'photo.upload.cancel': 'Cancelar',
    'photo.upload.save': 'Guardar Foto',

    // Command table
    'command.select.player': 'Por favor selecciona un jugador primero',
    'command.start': 'Iniciar',
    'command.pause': 'Pausar',
    'command.restart': 'Reiniciar',
    'command.first.half': '1er Tiempo',
    'command.second.half': '2do Tiempo',
    'command.home.team': 'Equipo Local',
    'command.away.team': 'Equipo Visitante',
    'command.actions': 'Acciones',
    'command.players': 'Jugadores',
    'command.registered.actions': 'Acciones Registradas',
    'command.no.actions': 'No hay acciones registradas aún',

    // Goal zones and origins
    'goal.zone.title': 'Zona del Gol',
    'goal.zone.cancel': 'Cancelar',
    'goal.origin.title': 'Origen del Gol',
    'goal.origin.set.play': 'Jugada de Pelota Parada',
    'goal.origin.duality': 'Dualidad',
    'goal.origin.fast.transition': 'Transición Rápida',
    'goal.origin.high.recovery': 'Recuperación Alta',
    'goal.origin.individual.action': 'Acción Individual',
    'goal.origin.rival.error': 'Error del Rival',
    'goal.origin.ball.loss.exit': 'Salida por Pérdida',
    'goal.origin.defensive.error': 'Error Defensivo',
    'goal.origin.won.back': 'Recuperado',
    'goal.origin.fast.counter': 'Contraataque Rápido',
    'goal.origin.rival.superiority': 'Superioridad del Rival',
    'goal.origin.strategy.goal': 'Gol Estratégico',

    // Positions (Spanish)
    'position.forward': 'Delantero',
    'position.midfielder': 'Centrocampista',
    'position.defender': 'Defensa',
    'position.goalkeeper': 'Portero',

    // General (Spanish)
    'general.season': 'Temporada',
    'general.success': 'éxito',
    'general.error': 'Error',

    // Blog
    'blog.title': 'Blog',

    // Matches
    'matches.title': 'Matches',
    'matches.completed': 'Completed',
    'matches.upcoming': 'Upcoming Matches',
    
    // Manual Actions (Spanish)
    'manual.actions.title': 'Acciones',
    'manual.actions.subtitle': 'Tabla de Acciones',
    'manual.actions.player': 'Jugador',
    'manual.actions.goals': 'Goles',
    'manual.actions.assists': 'Asistencias',
    'manual.actions.balls.lost': 'Balones Perdidos',
    'manual.actions.balls.recovered': 'Balones Recuperados',
    'manual.actions.duels.won': 'Duelos Ganados',
    'manual.actions.duels.lost': 'Duelos Perdidos',
    'manual.actions.shots.target': 'Tiros al Arco',
    'manual.actions.shots.off': 'Tiros Desviados',
    'manual.actions.fouls.committed': 'Faltas Cometidas',
    'manual.actions.fouls.received': 'Faltas Recibidas',
    'manual.actions.saves': 'Atajadas',
    'manual.actions.na': 'N/A',
    'manual.actions.realtime': 'Tiempo Real',
    'manual.actions.export': 'Exportar',
    'manual.actions.export.pdf': 'Exportar a PDF',
    'manual.actions.export.csv': 'Exportar a CSV',
    'manual.actions.export.json': 'Exportar a JSON',
    'manual.actions.save': 'Guardar Datos',
    'manual.actions.details': 'View Details',

    // Training section translations (Spanish)
    'trainings': 'Entrenamientos',
    'create_custom_training_sessions': 'Crea sesiones de entrenamiento personalizadas',
    'save_session': 'Guardar Sesión',
    'share': 'Compartir',
    'export_pdf': 'Exportar PDF',
    'history': 'Historial',
    'cancel': 'Cancelar',
    'create_exercise': 'Crear Ejercicio',
    'session_history': 'Historial de Sesiones',
    'no_saved_sessions': 'No hay sesiones guardadas aún',
    'session_loaded': 'Sesión cargada',
    'load': 'Cargar',
    'pdf': 'PDF',
    'create_new_exercise': 'Crear Nuevo Ejercicio',
    'exercise_name': 'Nombre del Ejercicio',
    'example_possession': 'Ej: Posesión 4v2',
    'duration_minutes': 'Duración (minutos)',
    'number_of_players': 'Número de Jugadores',
    'type': 'Tipo',
    'objective': 'Objetivo',
    'describe_exercise_objective': 'Describe el objetivo del ejercicio...',
    'exercise_gallery': 'Galería de Ejercicios',
    'search_exercises': 'Buscar ejercicios...',
    'all_categories': 'Todas',
    'all_types': 'Todos',
    'tactical': 'Táctico',
    'technical': 'Técnico',
    'physical': 'Físico',
    'cognitive': 'Cognitivo',
    'transitions': 'Transiciones',
    'abp': 'ABP',
    'special_situations': 'Situaciones Especiales',
    'min': 'min',
    'players_abbr': 'jug.',
    'training_session': 'Sesión de Entrenamiento',
    'session_name': 'Nombre de la sesión',
    'total_duration': 'Duración Total',
    'goal_90_minutes': 'Meta: 90 minutos',
    'drag_exercises_here': 'Arrastra ejercicios aquí para crear tu sesión',
    'smart_suggestions': 'Sugerencias Inteligentes',
    'recommendations_based_on_last_match': 'Basado en el último partido, recomendamos ejercicios defensivos',
    'pressure_after_loss': 'Presión tras pérdida',
    'defensive_corners': 'Córners defensivos',
    'new_session': 'Nueva Sesión',
    'exercise_added_to_session': '{name} añadido a la sesión',
    'exercise_removed_from_session': 'Ejercicio eliminado de la sesión',
    'please_fill_required_fields': 'Por favor completa todos los campos requeridos',
    'exercise_created_successfully': 'Ejercicio creado exitosamente',
    'share_link': 'Compartir Enlace',
    'share_via_email': 'Compartir por Email',
    'share_via_whatsapp': 'Compartir por WhatsApp',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.pricing': 'Pricing',
    'nav.demo': 'Demo',
    'nav.contact': 'Contact',
    'nav.signin': 'Sign In',
    'nav.signup': 'Sign Up',
    'nav.logout': 'Logout',
    'nav.dashboard': 'Dashboard',

    // Stats
    'general.stats': 'General Statistics',
    'performance': 'Performance',
    'attack': 'Attack',
    'defense': 'Defense',
    'discipline': 'Discipline',
    'wins': 'Wins',
    'draws': 'Draws',
    'losses': 'Losses',
    'goals.for': 'Goals For',
    'goals.against': 'Goals Against',
    'assists.total': 'Assists',
    'shots.goal': 'Shots On Goal',
    'shots.out': 'Shots Off Goal',
    'balls.recovered': 'Balls Recovered',
    'duels.won': 'Duels Won',
    'saves': 'Saves',
    'fouls.committed': 'Fouls Committed',
    'fouls.received': 'Fouls Received',
    'yellow.cards': 'Yellow Cards',
    'red.cards': 'Red Cards',
    'performance.trends': 'Performance Trends',
    'position.stats': 'Position Stats',
    'stats.no.performance.data': 'No performance data available yet.',
    'stats.add.matches.for.trends': 'Add matches to see performance trends.',
    'stats.no.position.data': 'No position data available yet.',
    'stats.add.players.matches.for.stats': 'Add players and matches to see position statistics.',

    // Players
    'players.goals': 'Goals',
    'players.assists': 'Assists',
    'players.shots.goal': 'Shots On Goal',
    'players.shots.out': 'Shots Off Goal',
    'players.balls.recovered': 'Balls Recovered',
    'players.duels.won': 'Duels Won',
    'players.saves': 'Saves',
    'players.fouls.committed': 'Fouls Committed',
    'players.fouls.received': 'Fouls Received',
    'players.yellow.cards': 'Yellow Cards',
    'players.red.cards': 'Red Cards',
    'players.position': 'Position',
    'players.number': 'Number',
    'players.age': 'Age',
    'players.height': 'Height',
    'players.weight': 'Weight',
    'players.dominant.foot': 'Dominant Foot',
    'players.join.date': 'Join Date',
    'players.contract.until': 'Contract Until',
    'players.status': 'Status',
    'players.active': 'Active',
    'players.injured': 'Injured',
    'players.suspended': 'Suspended',
    'players.rating': 'Rating',
    'players.notes': 'Notes',

    // Hero section
    'hero.title.digitize': 'Digitize your football team',
    'hero.subtitle': 'Comprehensive software for coaches that revolutionizes team management, statistics and training',

    // Features
    'features.title': 'Key Features',
    'features.subtitle': 'Everything you need to manage your team professionally',
    'features.training.title': 'Training Management',
    'features.training.description': 'Plan and record training sessions with custom exercises',
    'features.attendance.title': 'Attendance Control',
    'features.attendance.description': 'Complete tracking of player attendance',
    'features.stats.title': 'Advanced Statistics',
    'features.stats.description': 'Detailed analysis of individual and team performance',
    'features.reports.title': 'Professional Reports',
    'features.reports.description': 'Generate detailed reports and export data easily',

    // Benefits
    'benefits.title': 'Key Benefits',
    'benefits.subtitle': 'Discover why Statsor is the best choice for your team',
    'benefits.tactile.title': 'Touch Interface',
    'benefits.tactile.description': 'Optimized for tablets and mobile devices',
    'benefits.analysis.title': 'Smart Analysis',
    'benefits.analysis.description': 'AI that helps you make better tactical decisions',
    'benefits.offline.title': 'Works Offline',
    'benefits.offline.description': 'Record data even without internet connection',
    'benefits.reports.title': 'Automatic Reports',
    'benefits.reports.description': 'Generate professional reports automatically',

    // Pricing
    'pricing.title': 'Pricing Plans',
    'pricing.subtitle': 'Choose the plan that best fits your needs',
    'pricing.monthly': 'Monthly',
    'pricing.annual': 'Annual',
    'pricing.save': 'Save 20%',
    'pricing.starter.title': 'Starter',
    'pricing.starter.price': 'Free',
    'pricing.starter.period': 'per month',
    'pricing.pro.title': 'Pro',
    'pricing.pro.period': 'per month',
    'pricing.club.title': 'Club',
    'pricing.club.price': 'Custom',
    'pricing.club.period': 'per month',

    // CTA
    'cta.title': 'Ready to revolutionize your team?',
    'cta.subtitle': 'Join thousands of coaches already using Statsor',
    'cta.button': 'Start Free',

    // Testimonials
    'testimonials.title': 'What our users say',
    'testimonials.subtitle': 'Real testimonials from professional coaches',
    'testimonials.javier.quote': 'Statsor has completely transformed the way I manage my team. Real-time statistics are incredible.',
    'testimonials.luisa.quote': 'The ease of use and futsal-specific features have significantly improved our performance.',
    'testimonials.carlos.quote': 'Attendance control and training planning have saved us hours of administrative work.',

    // Search
    'search.placeholder': 'Search...',

    // Footer
    'footer.product': 'Product',
    'footer.resources': 'Resources',
    'footer.company': 'Company',
    'footer.rights': '© 2024 Statsor. All rights reserved.',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',

    // Auth
    'auth.signin.title': 'Sign In',
    'auth.signin.subtitle': 'Access your Statsor account',
    'auth.signin.button': 'Sign In',
    'auth.signup.title': 'Create Account',
    'auth.signup.subtitle': 'Join the digital football revolution',
    'auth.signup.button': 'Create Account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgot.password': 'Forgot your password?',
    'auth.no.account': "Don't have an account?",
    'auth.have.account': 'Already have an account?',
    'auth.signin.link': 'Sign in',
    'auth.signup.link': 'Sign up',
    'auth.google.button': 'Continue with Google',

    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.home': 'Home',
    'dashboard.points': 'Points',
    'dashboard.victories': 'Victories',
    'dashboard.current.season': 'Current Season',
    'dashboard.add.team': 'Add Team',
    'dashboard.create.team': 'Create New Team',
    'dashboard.team.name': 'Team Name',
    'dashboard.enter.team.name': 'Enter team name',
    'dashboard.cancel': 'Cancel',
    'dashboard.create.team.button': 'Create Team',
    'dashboard.subscription': 'Subscription',
    'dashboard.current.plan': 'Current Plan',
    'dashboard.status': 'Status',
    'dashboard.manage.subscription': 'Manage Subscription',
    'dashboard.quick.actions': 'Quick Actions',
    'dashboard.add.player': 'Add Player',
    'dashboard.create.match': 'Create Match',
    'dashboard.view.stats': 'View Stats',
    'dashboard.recent.activity': 'Recent Activity',
    'dashboard.no.activity': 'No recent activity',
    'dashboard.player.management': 'Player Management',
    'dashboard.tactical.chat': 'Tactical Chat',

    // Sport Selection
    'sport.selection.title': 'Select Your Sport',
    'sport.selection.subtitle': 'Choose your main sport to customize your experience',
    'sport.selection.selected': 'Selected!',
    'sport.selection.confirm': 'Confirm Selection',
    'sport.soccer': 'Soccer',
    'sport.futsal': 'Futsal',
    'sport.soccer.description': 'Traditional 11-player football',
    'sport.futsal.description': '5-player indoor football',
    'sport.soccer.feature1': 'Squad management up to 25 players',
    'sport.soccer.feature2': 'Tactical analysis for 11vs11 formations',
    'sport.soccer.feature3': 'Specific position tracking',
    'sport.soccer.feature4': 'Full match statistics (90 min)',
    'sport.futsal.feature1': 'Intensive rotation control',
    'sport.futsal.feature2': 'Small space game analysis',
    'sport.futsal.feature3': 'Intensity and pace metrics',
    'sport.futsal.feature4': 'Match statistics (40 min)',

    // Goal locations
    'goal.location.title': 'Goal Location',
    'goal.location.subtitle': 'Select where the goal was scored',
    'goal.location.top.left': 'Top Left',
    'goal.location.top.center': 'Top Center',
    'goal.location.top.right': 'Top Right',
    'goal.location.middle.left': 'Middle Left',
    'goal.location.middle.center': 'Middle Center',
    'goal.location.middle.right': 'Middle Right',
    'goal.location.bottom.left': 'Bottom Left',
    'goal.location.bottom.center': 'Bottom Center',
    'goal.location.bottom.right': 'Bottom Right',
    'goal.location.goal.target': 'Goal',
    'goal.location.cancel': 'Cancel',

    // Photo upload
    'photo.upload.title': 'Upload Photo',
    'photo.upload.select': 'Select Photo',
    'photo.upload.selected': 'Selected',
    'photo.upload.size': 'Size',
    'photo.upload.cancel': 'Cancel',
    'photo.upload.save': 'Save Photo',

    // Command table
    'command.select.player': 'Please select a player first',
    'command.start': 'Start',
    'command.pause': 'Pause',
    'command.restart': 'Restart',
    'command.first.half': '1st Half',
    'command.second.half': '2nd Half',
    'command.home.team': 'Home Team',
    'command.away.team': 'Away Team',
    'command.actions': 'Actions',
    'command.players': 'Players',
    'command.registered.actions': 'Registered Actions',
    'command.no.actions': 'No actions registered yet',

    // Goal zones and origins
    'goal.zone.title': 'Goal Zone',
    'goal.zone.cancel': 'Cancel',
    'goal.origin.title': 'Goal Origin',
    'goal.origin.set.play': 'Set Play',
    'goal.origin.duality': 'Duality',
    'goal.origin.fast.transition': 'Fast Transition',
    'goal.origin.high.recovery': 'High Recovery',
    'goal.origin.individual.action': 'Individual Action',
    'goal.origin.rival.error': 'Rival Error',
    'goal.origin.ball.loss.exit': 'Ball Loss Exit',
    'goal.origin.defensive.error': 'Defensive Error',
    'goal.origin.won.back': 'Won Back',
    'goal.origin.fast.counter': 'Fast Counter',
    'goal.origin.rival.superiority': 'Rival Superiority',
    'goal.origin.strategy.goal': 'Strategy Goal',

    // Positions (English)
    'position.forward': 'Forward',
    'position.midfielder': 'Midfielder',
    'position.defender': 'Defender',
    'position.goalkeeper': 'Goalkeeper',

    // General
    'general.season': 'Season',
    'general.success': 'success',
    'general.error': 'Error',

    // Blog
    'blog.title': 'Blog',

    // Matches
    'matches.title': 'Matches',
    'matches.completed': 'Completed',
    'matches.upcoming': 'Upcoming Matches',
    
    // Manual Actions (English)
    'manual.actions.title': 'Actions',
    'manual.actions.subtitle': 'Actions Table',
    'manual.actions.player': 'Player',
    'manual.actions.goals': 'Goals',
    'manual.actions.assists': 'Assists',
    'manual.actions.balls.lost': 'Balls Lost',
    'manual.actions.balls.recovered': 'Balls Recovered',
    'manual.actions.duels.won': 'Duels Won',
    'manual.actions.duels.lost': 'Duels Lost',
    'manual.actions.shots.target': 'Shots on Target',
    'manual.actions.shots.off': 'Shots Off Target',
    'manual.actions.fouls.committed': 'Fouls Committed',
    'manual.actions.fouls.received': 'Fouls Received',
    'manual.actions.saves': 'Saves',
    'manual.actions.na': 'N/A',
    'manual.actions.realtime': 'Real-time',
    'manual.actions.export': 'Export',
    'manual.actions.export.pdf': 'Export to PDF',
    'manual.actions.export.csv': 'Export to CSV',
    'manual.actions.export.json': 'Export to JSON',
    'manual.actions.save': 'Save Data',
    'manual.actions.details': 'View Details',

    // Training section translations (English)
    'trainings': 'Trainings',
    'create_custom_training_sessions': 'Create custom training sessions',
    'save_session': 'Save Session',
    'share': 'Share',
    'export_pdf': 'Export PDF',
    'history': 'History',
    'cancel': 'Cancel',
    'create_exercise': 'Create Exercise',
    'session_history': 'Session History',
    'no_saved_sessions': 'No saved sessions yet',
    'session_loaded': 'Session loaded',
    'load': 'Load',
    'pdf': 'PDF',
    'create_new_exercise': 'Create New Exercise',
    'exercise_name': 'Exercise Name',
    'example_possession': 'E.g: Possession 4v2',
    'duration_minutes': 'Duration (minutes)',
    'number_of_players': 'Number of Players',
    'type': 'Type',
    'objective': 'Objective',
    'describe_exercise_objective': 'Describe the objective of the exercise...',
    'exercise_gallery': 'Exercise Gallery',
    'search_exercises': 'Search exercises...',
    'all_categories': 'All',
    'all_types': 'All',
    'tactical': 'Tactical',
    'technical': 'Technical',
    'physical': 'Physical',
    'cognitive': 'Cognitive',
    'transitions': 'Transitions',
    'abp': 'ABP',
    'special_situations': 'Special Situations',
    'min': 'min',
    'players_abbr': 'plyrs',
    'training_session': 'Training Session',
    'session_name': 'Session Name',
    'total_duration': 'Total Duration',
    'goal_90_minutes': 'Goal: 90 minutes',
    'drag_exercises_here': 'Drag exercises here to create your session',
    'smart_suggestions': 'Smart Suggestions',
    'recommendations_based_on_last_match': 'Based on the last match, we recommend defensive exercises',
    'pressure_after_loss': 'Pressure after loss',
    'defensive_corners': 'Defensive corners',
    'new_session': 'New Session',
    'exercise_added_to_session': '{name} added to session',
    'exercise_removed_from_session': 'Exercise removed from session',
    'please_fill_required_fields': 'Please fill all required fields',
    'exercise_created_successfully': 'Exercise created successfully',
    'share_link': 'Share Link',
    'share_via_email': 'Share via Email',
    'share_via_whatsapp': 'Share via WhatsApp',
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const savedLanguage = localStorage.getItem('statsor_language');
      return (savedLanguage as Language) || 'en';
    } catch (error) {
      return 'en';
    }
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    try {
      localStorage.setItem('statsor_language', newLanguage);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  };

  const t = (key: string): string => {
    // Check if we're on the landing page
    const isLandingPage = window.location.pathname === '/';
    
    // For the landing page, always use English
    const effectiveLanguage = isLandingPage ? 'en' : language;

    // First try direct key lookup (flat structure)
    const currentLangTranslations = translations[effectiveLanguage];
    if (currentLangTranslations && currentLangTranslations[key as keyof typeof currentLangTranslations]) {
      return currentLangTranslations[key as keyof typeof currentLangTranslations];
    }
    
    // Try fallback to English for direct key lookup
    const englishTranslations = translations.en;
    if (englishTranslations && englishTranslations[key as keyof typeof englishTranslations]) {
      return englishTranslations[key as keyof typeof englishTranslations];
    }
    
    // Fallback to nested object approach (for backward compatibility)
    const keys = key.split('.');
    
    // Try current language first
    let value: any = translations[effectiveLanguage];
    let keyFound = true;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        keyFound = false;
        break;
      }
    }
    
    if (keyFound && typeof value === 'string') {
      return value;
    }
    
    // Try fallback to English if key not found in current language
    let fallbackValue: any = translations.en;
    let fallbackKeyFound = true;
    
    for (const fallbackKey of keys) {
      if (fallbackValue && typeof fallbackValue === 'object' && fallbackKey in fallbackValue) {
        fallbackValue = fallbackValue[fallbackKey];
      } else {
        fallbackKeyFound = false;
        break;
      }
    }
    
    if (fallbackKeyFound && typeof fallbackValue === 'string') {
      return fallbackValue;
    }
    
    // Special case for dataManagement to ensure we get the translations
    if (key === 'dataManagement.title') {
      return 'Data Management Center';
    } else if (key === 'dataManagement.subtitle') {
      return 'Comprehensive player and club data management system';
    }
    
    // If not found anywhere, return a readable version of the key
    return key.split('.').pop()?.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) || key;
  };

  const value: LanguageContextType = {
    language,
    currentLanguage: language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};