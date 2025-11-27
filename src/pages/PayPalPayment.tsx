import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  CreditCard,
  Lock,
  Star,
  Loader2,
  AlertCircle,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { paypalService } from '../services/paypalService';

const PayPalPayment: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { plans } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    const planId = searchParams.get('plan');
    const interval = searchParams.get('interval') as 'monthly' | 'yearly';

    if (planId) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(planId);
        if (interval) {
          setBillingInterval(interval);
        }
      } else {
        toast.error(language === 'en' ? 'Invalid plan selected' : 'Plan inválido seleccionado');
        navigate('/pricing');
      }
    } else {
      navigate('/pricing');
    }
  }, [searchParams, plans, navigate, language]);

  const handlePayment = async () => {
    if (!user || !selectedPlan) {
      toast.error(language === 'en' ? 'Please select a plan and sign in' : 'Por favor selecciona un plan e inicia sesión');
      return;
    }

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) {
      toast.error(language === 'en' ? 'Plan not found' : 'Plan no encontrado');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    try {
      const amount = billingInterval === 'yearly' ? plan.price : Math.round(plan.price / 10);

      const paymentData = {
        planId: selectedPlan,
        planName: plan.name,
        amount,
        currency: 'EUR',
        billingInterval,
        userEmail: user.email!,
        userId: user.id
      };

      const response = await paypalService.createPayment(paymentData);

      if (response.success && response.redirectUrl) {
        setPaymentStatus('success');
        toast.success(language === 'en' ? 'Redirecting to PayPal...' : 'Redirigiendo a PayPal...');
        setTimeout(() => {
          window.location.href = response.redirectUrl!;
        }, 1500);
      } else {
        setPaymentStatus('failed');
        toast.error(response.error || (language === 'en' ? 'Payment failed' : 'Pago fallido'));
        setLoading(false);
      }
    } catch (error) {
      console.error('PayPal payment error:', error);
      setPaymentStatus('failed');
      toast.error(language === 'en' ? 'Payment service error' : 'Error en el servicio de pago');
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'processing':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <CreditCard className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'processing':
        return language === 'en' ? 'Processing your payment...' : 'Procesando tu pago...';
      case 'success':
        return language === 'en' ? 'Redirecting to PayPal...' : 'Redirigiendo a PayPal...';
      case 'failed':
        return language === 'en' ? 'Payment failed. Please try again.' : 'Pago fallido. Por favor, inténtalo de nuevo.';
      default:
        return language === 'en' ? 'Ready to process payment' : 'Listo para procesar el pago';
    }
  };

  const getPlanPrice = (plan: any) => {
    if (billingInterval === 'yearly') {
      return plan.price;
    } else {
      return Math.round(plan.price / 10);
    }
  };

  const selectedPlanData = selectedPlan ? plans.find(p => p.id === selectedPlan) : null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'midnight'
        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900'
        : 'bg-gradient-to-br from-gray-50 to-white'
    }`}>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/pricing')}
            className={`mr-4 ${
              theme === 'midnight' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'en' ? 'Back to Pricing' : 'Volver a Precios'}
          </Button>
          <h1 className={`text-3xl font-bold ${
            theme === 'midnight' ? 'text-white' : 'text-gray-900'
          }`}>
            {language === 'en' ? 'Secure PayPal Payment' : 'Pago Seguro con PayPal'}
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`h-fit ${
              theme === 'midnight'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <CardHeader>
                <h2 className={`text-xl font-semibold ${
                  theme === 'midnight' ? 'text-white' : 'text-gray-900'
                }`}>
                  {language === 'en' ? 'Order Summary' : 'Resumen del Pedido'}
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPlanData && (
                  <motion.div
                    className={`p-4 rounded-lg border-2 ${
                      theme === 'midnight'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <h3 className={`font-semibold ${
                          theme === 'midnight' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {selectedPlanData.name}
                        </h3>
                        {selectedPlanData.popular && (
                          <Badge className="ml-2 bg-yellow-500 text-black">
                            <Crown className="w-3 h-3 mr-1" />
                            {language === 'en' ? 'Popular' : 'Popular'}
                          </Badge>
                        )}
                      </div>
                      <div className={`text-right ${
                        theme === 'midnight' ? 'text-white' : 'text-gray-900'
                      }`}>
                        <div className="text-2xl font-bold">
                          €{getPlanPrice(selectedPlanData)}
                        </div>
                        <div className={`text-sm ${
                          theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          /{billingInterval === 'yearly' ? (language === 'en' ? 'year' : 'año') : (language === 'en' ? 'month' : 'mes')}
                        </div>
                      </div>
                    </div>
                    <p className={`text-sm mb-3 ${
                      theme === 'midnight' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {selectedPlanData.description}
                    </p>
                    <div className="space-y-1">
                      {selectedPlanData.features.slice(0, 5).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <CheckCircle className={`w-4 h-4 mr-2 ${
                            theme === 'midnight' ? 'text-green-400' : 'text-green-500'
                          }`} />
                          <span className={theme === 'midnight' ? 'text-gray-300' : 'text-gray-600'}>
                            {feature}
                          </span>
                        </div>
                      ))}
                      {selectedPlanData.features.length > 5 && (
                        <div className={`text-sm ${
                          theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          ...and {selectedPlanData.features.length - 5} more features
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                <div className={`p-4 rounded-lg border ${
                  theme === 'midnight' ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h4 className={`font-medium mb-3 ${
                    theme === 'midnight' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {language === 'en' ? 'Billing Details' : 'Detalles de Facturación'}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={theme === 'midnight' ? 'text-gray-300' : 'text-gray-600'}>
                        {language === 'en' ? 'Billing Cycle' : 'Ciclo de Facturación'}
                      </span>
                      <span className={theme === 'midnight' ? 'text-white' : 'text-gray-900'}>
                        {billingInterval === 'yearly' ? (language === 'en' ? 'Yearly' : 'Anual') : (language === 'en' ? 'Monthly' : 'Mensual')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'midnight' ? 'text-gray-300' : 'text-gray-600'}>
                        {language === 'en' ? 'Payment Method' : 'Método de Pago'}
                      </span>
                      <span className={theme === 'midnight' ? 'text-white' : 'text-gray-900'}>
                        PayPal
                      </span>
                    </div>
                    <hr className={theme === 'midnight' ? 'border-gray-600' : 'border-gray-200'} />
                    <div className="flex justify-between font-semibold text-lg">
                      <span className={theme === 'midnight' ? 'text-white' : 'text-gray-900'}>
                        {language === 'en' ? 'Total' : 'Total'}
                      </span>
                      <span className={theme === 'midnight' ? 'text-white' : 'text-gray-900'}>
                        €{selectedPlanData ? getPlanPrice(selectedPlanData) : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`h-fit ${
              theme === 'midnight'
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-yellow-500/30'
                : 'bg-gradient-to-br from-white to-gray-50 border-blue-200'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  {getStatusIcon()}
                </div>
                <h2 className={`text-xl font-semibold text-center ${
                  theme === 'midnight' ? 'text-white' : 'text-gray-900'
                }`}>
                  {language === 'en' ? 'Complete Your Payment' : 'Completa tu Pago'}
                </h2>
                <p className={`text-center ${
                  theme === 'midnight' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {getStatusMessage()}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className={`p-4 rounded-full ${
                    theme === 'midnight' ? 'bg-yellow-500/20' : 'bg-blue-100'
                  }`}>
                    <svg className="w-16 h-16 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-.635 4.005c-.08.52-.527.901-1.05.901zm2.18-14.97c-.524 0-.968.382-1.05.9l-.635 4.005c-.08.52-.527.901-1.05.901H4.331l1.635-10.337h5.11c1.76 0 3.027.351 3.716 1.425.517.806.414 1.895-.317 3.114-.731 1.22-2.065 1.992-3.719 1.992H9.256z"/>
                    </svg>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={loading || !selectedPlan || paymentStatus === 'processing'}
                  className={`w-full h-14 text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                    theme === 'midnight'
                      ? 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-black shadow-lg shadow-yellow-500/25'
                      : 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/25'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-3" />
                      {language === 'en' ? 'Processing...' : 'Procesando...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-.635 4.005c-.08.52-.527.901-1.05.901zm2.18-14.97c-.524 0-.968.382-1.05.9l-.635 4.005c-.08.52-.527.901-1.05.901H4.331l1.635-10.337h5.11c1.76 0 3.027.351 3.716 1.425.517.806.414 1.895-.317 3.114-.731 1.22-2.065 1.992-3.719 1.992H9.256z"/>
                      </svg>
                      {language === 'en' ? 'Pay with PayPal' : 'Pagar con PayPal'}
                    </>
                  )}
                </Button>

                <div className="space-y-3">
                  <div className={`flex items-center justify-center text-sm ${
                    theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Shield className="w-4 h-4 mr-2" />
                    {language === 'en' ? 'Protected by PayPal Buyer Protection' : 'Protegido por PayPal Buyer Protection'}
                  </div>
                  <div className={`flex items-center justify-center text-sm ${
                    theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Lock className="w-4 h-4 mr-2" />
                    {language === 'en' ? '256-bit SSL encryption' : 'Cifrado SSL de 256 bits'}
                  </div>
                  <div className="flex items-center justify-center space-x-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className={`text-center text-xs ${
                    theme === 'midnight' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {language === 'en' ? 'Trusted by millions worldwide' : 'Confiado por millones en todo el mundo'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PayPalPayment;
