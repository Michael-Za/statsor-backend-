import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Check, Mail, CreditCard, Star, Zap, Crown, Shield, Users, Brain, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Switch } from '../components/ui/switch';

const Pricing: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { plans } = useSubscription();
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('yearly');

  const handleContactSales = () => {
    const email = 'statsor1@gmail.com';
    const subject = 'Pro Plus Plan Inquiry';
    const body = `Hello Statsor Team,

I am interested in the Pro Plus plan and would like to discuss enterprise solutions for my organization.

Please contact me to discuss:
- Custom pricing
- Specific feature requirements
- Implementation timeline
- Training and support options

Best regards`;

    // Create mailto link with proper encoding
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Show confirmation toast
    toast.success(`Opening email to ${email}`, {
      description: 'If your email client doesn\'t open, please email us directly at statsor1@gmail.com'
    });
    
    // Redirect to mailto link (this will open the email client)
    window.location.href = mailtoLink;
  };

  const handleGetStarted = (planId: string) => {
    if (!user) {
      toast.info(language === 'en' ? 'Please sign in to get started' : 'Por favor inicia sesión para comenzar');
      navigate('/signin');
      return;
    }

    if (planId === 'free') {
      toast.success(language === 'en' ? 'You are now on the Free plan' : 'Ahora estás en el plan Gratuito');
      navigate('/dashboard');
    } else if (planId === 'pro_plus') {
      handleContactSales();
    } else {
      navigate(`/paypal-payment?plan=${planId}&interval=${billingInterval}`);
    }
  };

  const getProPrice = () => {
    return billingInterval === 'yearly' ? '90' : '10';
  };

  const getProPeriod = () => {
    return billingInterval === 'yearly'
      ? (language === 'en' ? '/year' : '/año')
      : (language === 'en' ? '/month' : '/mes');
  };

  const getSavings = () => {
    if (billingInterval === 'yearly') {
      return language === 'en' ? 'Save €30' : 'Ahorra €30';
    }
    return null;
  };

  const planIcons = {
    free: <Star className="w-6 h-6 text-blue-600" />,
    pro: <Zap className="w-6 h-6 text-blue-600" />,
    pro_plus: <Crown className="w-6 h-6 text-blue-600" />
  };

  const displayPlans = plans.map(plan => ({
    ...plan,
    displayPrice: plan.id === 'free'
      ? (language === 'en' ? 'Free' : 'Gratis')
      : plan.id === 'pro'
        ? `€${getProPrice()}`
        : (language === 'en' ? 'Custom' : 'Personalizado'),
    displayPeriod: plan.id === 'pro' ? getProPeriod() : '',
    icon: planIcons[plan.id as keyof typeof planIcons],
    popular: plan.popular || false
  }));

  const platformFeatures = [
    {
      icon: <Brain className="w-6 h-6 text-blue-600" />,
      title: language === 'en' ? 'AI Tactical Assistant' : 'Asistente Táctico IA',
      description: language === 'en'
        ? 'Get real-time tactical suggestions and analysis powered by advanced AI'
        : 'Obtén sugerencias tácticas y análisis en tiempo real con IA avanzada'
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
      title: language === 'en' ? 'Advanced Analytics' : 'Análisis Avanzado',
      description: language === 'en'
        ? 'Track performance metrics, match statistics, and player development'
        : 'Rastrea métricas de rendimiento, estadísticas de partidos y desarrollo de jugadores'
    },
    {
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
      title: language === 'en' ? 'Training Planner' : 'Planificador de Entrenamientos',
      description: language === 'en'
        ? 'Plan and schedule training sessions with customizable exercises'
        : 'Planifica y programa sesiones de entrenamiento con ejercicios personalizables'
    },
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: language === 'en' ? 'Team Management' : 'Gestión de Equipos',
      description: language === 'en'
        ? 'Manage your team, players, and track their progress over time for Football and Futsal'
        : 'Gestiona tu equipo, jugadores y rastrea su progreso en el tiempo para Fútbol y Futsal'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
      title: language === 'en' ? 'Performance Insights' : 'Análisis de Rendimiento',
      description: language === 'en'
        ? 'Identify strengths, weaknesses, and areas for improvement'
        : 'Identifica fortalezas, debilidades y áreas de mejora'
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      title: language === 'en' ? 'Secure & Reliable' : 'Seguro y Confiable',
      description: language === 'en'
        ? 'Your data is encrypted and backed up with enterprise-grade security'
        : 'Tus datos están encriptados y respaldados con seguridad empresarial'
    }
  ];

  return (
    <div className="min-h-screen py-16 px-4 bg-white text-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            {language === 'en' ? 'Choose Your Plan' : 'Elige Tu Plan'}
          </h1>
          <p className="text-lg max-w-2xl mx-auto text-gray-600">
            {language === 'en'
              ? "Unlock powerful features to manage your team professionally. All plans include secure data storage and regular updates."
              : "Desbloquea funciones poderosas para gestionar tu equipo profesionalmente. Todos los planes incluyen almacenamiento seguro y actualizaciones regulares."}
          </p>
        </div>

        <div className="flex justify-center items-center mb-16">
          <div className="flex items-center space-x-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <span className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600'
            }`}>
              {language === 'en' ? 'Monthly' : 'Mensual'}
            </span>

            <Switch
              checked={billingInterval === 'yearly'}
              onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
              className="data-[state=checked]:bg-blue-600"
            />

            <span className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
              billingInterval === 'yearly'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600'
            }`}>
              {language === 'en' ? 'Annual' : 'Anual'}
            </span>

            {billingInterval === 'yearly' && getSavings() && (
              <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                {getSavings()}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {displayPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`h-full border-2 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${
                plan.popular
                  ? 'border-blue-600 relative'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {plan.popular && (
                <div className="bg-blue-600 text-white text-center py-2 text-sm font-semibold">
                  {language === 'en' ? '⚡ Most Popular' : '⚡ Más Popular'}
                </div>
              )}

              <CardHeader className="text-center pb-6 pt-8 bg-gradient-to-b from-blue-50 to-white">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white border-2 border-blue-600 shadow-md">
                    {plan.icon}
                  </div>
                </div>

                <CardTitle className="text-2xl font-bold mb-2 text-gray-900">
                  {plan.name}
                </CardTitle>

                <p className="text-sm text-gray-600 mb-6 min-h-[40px]">{plan.description}</p>

                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">
                    {plan.displayPrice}
                  </span>
                  {plan.displayPeriod && (
                    <span className="text-base text-gray-600 ml-1">
                      {plan.displayPeriod}
                    </span>
                  )}
                </div>

                {plan.id === 'pro' && billingInterval === 'monthly' && (
                  <p className="text-xs text-gray-500">
                    {language === 'en' ? 'Billed monthly' : 'Facturado mensualmente'}
                  </p>
                )}

                {plan.id === 'pro' && billingInterval === 'yearly' && (
                  <p className="text-xs text-gray-500">
                    {language === 'en' ? 'Billed annually (€90/year)' : 'Facturado anualmente (€90/año)'}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-6 pt-8 pb-8">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3 text-sm text-gray-700">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-blue-100">
                        <Check className="w-3 h-3 text-blue-600" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {plan.id === 'pro_plus' ? (
                    <Button
                      onClick={handleContactSales}
                      className="w-full py-6 font-semibold rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Contact Us' : 'Contáctanos'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleGetStarted(plan.id)}
                      className={`w-full py-6 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all ${
                        plan.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : plan.id === 'free'
                          ? 'bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      {plan.id === 'pro' ? (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          {language === 'en' ? 'Subscribe Now' : 'Suscribirse Ahora'}
                        </>
                      ) : (
                        language === 'en' ? 'Get Started' : 'Comenzar'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
            {language === 'en' ? 'Powerful Platform Features' : 'Funciones Poderosas de la Plataforma'}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {language === 'en'
              ? 'Built for coaches, teams, and sports professionals who demand the best'
              : 'Creado para entrenadores, equipos y profesionales del deporte que exigen lo mejor'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {platformFeatures.map((feature, index) => (
              <div key={index} className="p-6 rounded-xl border-2 border-blue-100 bg-white hover:border-blue-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2 text-gray-900 text-lg">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            {language === 'en' ? 'Frequently Asked Questions' : 'Preguntas Frecuentes'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                q: language === 'en' ? 'Can I change my plan anytime?' : '¿Puedo cambiar mi plan en cualquier momento?',
                a: language === 'en' ? 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.' : 'Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios surten efecto inmediatamente.'
              },
              {
                q: language === 'en' ? 'Is there a free trial for Pro?' : '¿Hay una prueba gratuita para Pro?',
                a: language === 'en' ? 'The Free plan is always available to try our platform. Upgrade to Pro anytime to access advanced features.' : 'El plan Gratuito siempre está disponible para probar nuestra plataforma. Actualiza a Pro en cualquier momento para acceder a funciones avanzadas.'
              },
              {
                q: language === 'en' ? 'What payment methods do you accept?' : '¿Qué métodos de pago aceptan?',
                a: language === 'en' ? 'We accept PayPal for all subscriptions. PayPal supports credit cards, debit cards, and bank accounts.' : 'Aceptamos PayPal para todas las suscripciones. PayPal admite tarjetas de crédito, débito y cuentas bancarias.'
              },
              {
                q: language === 'en' ? 'Can I cancel anytime?' : '¿Puedo cancelar en cualquier momento?',
                a: language === 'en' ? 'Yes, you can cancel your subscription at any time. You will continue to have access until the end of your billing period.' : 'Sí, puedes cancelar tu suscripción en cualquier momento. Continuarás teniendo acceso hasta el final de tu período de facturación.'
              },
              {
                q: language === 'en' ? 'What makes the Pro plan worth it?' : '¿Qué hace que el plan Pro valga la pena?',
                a: language === 'en' ? 'Pro unlocks AI-powered insights, unlimited player tracking, advanced analytics, and priority support - everything you need for professional team management in Football and Futsal.' : 'Pro desbloquea información con IA, seguimiento ilimitado de jugadores, análisis avanzados y soporte prioritario: todo lo que necesitas para la gestión profesional del equipo en Fútbol y Futsal.'
              },
              {
                q: language === 'en' ? 'How does the AI Assistant work?' : '¿Cómo funciona el Asistente de IA?',
                a: language === 'en' ? 'Our AI analyzes your team data, match statistics, and training patterns to provide personalized tactical recommendations and insights in real-time.' : 'Nuestra IA analiza los datos de tu equipo, estadísticas de partidos y patrones de entrenamiento para proporcionar recomendaciones tácticas e información personalizada en tiempo real.'
              }
            ].map((faq, index) => (
              <div key={index} className="p-6 rounded-xl border-2 border-blue-100 bg-white hover:border-blue-300 hover:shadow-md transition-all">
                <h3 className="font-semibold mb-3 text-gray-900 flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3 mt-0.5 text-sm">
                    {index + 1}
                  </div>
                  {faq.q}
                </h3>
                <p className="text-sm text-gray-600 pl-9">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center py-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl text-white shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {language === 'en' ? 'Ready to Elevate Your Team?' : '¿Listo para Elevar Tu Equipo?'}
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto text-blue-100">
            {language === 'en'
              ? 'Join coaches worldwide using Statsor to make smarter decisions and win more games.'
              : 'Únete a entrenadores de todo el mundo que usan Statsor para tomar decisiones más inteligentes y ganar más juegos.'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={() => handleGetStarted('free')}
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {language === 'en' ? 'Start Free' : 'Comenzar Gratis'}
            </Button>
            <Button
              onClick={() => handleGetStarted('pro')}
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold py-3 px-8 rounded-xl transition-all"
            >
              {language === 'en' ? 'Go Pro' : 'Hazte Pro'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
