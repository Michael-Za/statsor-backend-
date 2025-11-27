import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Home, CreditCard, Loader2, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { paypalService } from '../services/paypalService';
import { toast } from 'sonner';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [verifying, setVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const token = searchParams.get('token');

        if (token) {
          const verified = await paypalService.verifyPayment(token);

          if (verified) {
            setPaymentVerified(true);
            toast.success(language === 'en' ? 'Payment verified successfully!' : '¡Pago verificado exitosamente!');
          } else {
            toast.error(language === 'en' ? 'Payment verification failed' : 'Verificación de pago fallida');
          }
        } else {
          toast.error(language === 'en' ? 'No payment information found' : 'No se encontró información del pago');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error(language === 'en' ? 'Error verifying payment' : 'Error al verificar el pago');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, language]);

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      theme === 'midnight'
        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white'
        : 'bg-gradient-to-br from-blue-50 via-white to-green-50 text-gray-900'
    }`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          {verifying ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className={`mx-auto h-16 w-16 rounded-full border-4 ${
                theme === 'midnight'
                  ? 'border-yellow-500 border-t-transparent'
                  : 'border-green-500 border-t-transparent'
              }`}
            />
          ) : paymentVerified ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${
                theme === 'midnight' ? 'bg-green-600' : 'bg-green-500'
              }`}
            >
              <CheckCircle className="h-8 w-8 text-white" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${
                theme === 'midnight' ? 'bg-red-600' : 'bg-red-500'
              }`}
            >
              <XCircle className="h-8 w-8 text-white" />
            </motion.div>
          )}

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`mt-6 text-3xl font-bold ${
              theme === 'midnight' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {verifying
              ? (language === 'en' ? 'Verifying Payment...' : 'Verificando Pago...')
              : paymentVerified
                ? (language === 'en' ? 'Payment Successful!' : '¡Pago Exitoso!')
                : (language === 'en' ? 'Payment Failed' : 'Pago Fallido')
            }
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`mt-2 text-sm ${
              theme === 'midnight' ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            {verifying
              ? (language === 'en' ? 'Please wait while we verify your payment...' : 'Por favor espera mientras verificamos tu pago...')
              : paymentVerified
                ? (language === 'en' ? 'Your subscription has been activated successfully!' : '¡Tu suscripción ha sido activada exitosamente!')
                : (language === 'en' ? 'There was an issue with your payment. Please try again.' : 'Hubo un problema con tu pago. Por favor, inténtalo de nuevo.')
            }
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {!verifying && (
            <>
              <Button
                onClick={() => navigate('/dashboard')}
                className={`w-full ${
                  theme === 'midnight'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Go to Dashboard' : 'Ir al Panel'}
              </Button>

              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className={`w-full ${
                  theme === 'midnight'
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                    : ''
                }`}
              >
                <Home className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Back to Home' : 'Volver al Inicio'}
              </Button>

              {!paymentVerified && (
                <Button
                  onClick={() => navigate('/pricing')}
                  variant="outline"
                  className={`w-full ${
                    theme === 'midnight'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                      : ''
                  }`}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {language === 'en' ? 'Try Again' : 'Intentar de Nuevo'}
                </Button>
              )}
            </>
          )}
        </motion.div>

        {paymentVerified && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`mt-8 p-4 rounded-lg border ${
              theme === 'midnight'
                ? 'bg-green-900/20 border-green-800'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <h3 className={`text-sm font-semibold mb-2 ${
              theme === 'midnight' ? 'text-green-200' : 'text-green-800'
            }`}>
              {language === 'en' ? 'What happens next?' : '¿Qué pasa ahora?'}
            </h3>
            <ul className={`text-sm space-y-1 ${
              theme === 'midnight' ? 'text-green-300' : 'text-green-700'
            }`}>
              <li>• {language === 'en' ? "You'll receive a confirmation email from PayPal" : 'Recibirás un email de confirmación de PayPal'}</li>
              <li>• {language === 'en' ? 'Your subscription is now active' : 'Tu suscripción ya está activa'}</li>
              <li>• {language === 'en' ? 'Access all premium features immediately' : 'Accede a todas las funciones premium inmediatamente'}</li>
              <li>• {language === 'en' ? 'Manage your subscription anytime in settings' : 'Administra tu suscripción en cualquier momento desde configuración'}</li>
            </ul>
          </motion.div>
        )}

        {verifying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center"
          >
            <Loader2 className={`w-6 h-6 animate-spin ${
              theme === 'midnight' ? 'text-yellow-500' : 'text-blue-500'
            }`} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
