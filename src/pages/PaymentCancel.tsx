import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, Home, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      theme === 'dark' 
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto h-16 w-16 rounded-full bg-yellow-500 flex items-center justify-center"
          >
            <XCircle className="h-8 w-8 text-white" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-3xl font-bold"
          >
            {language === 'en' ? 'Payment Cancelled' : 'Pago Cancelado'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-sm opacity-70"
          >
            {language === 'en' 
              ? 'Your payment was cancelled. No charges were made to your account.'
              : 'Tu pago fue cancelado. No se realizaron cargos en tu cuenta.'
            }
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <Button
            onClick={() => navigate('/pricing')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {language === 'en' ? 'Try Again' : 'Intentar de Nuevo'}
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            {language === 'en' ? 'Back to Home' : 'Volver al Inicio'}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
        >
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            {language === 'en' ? 'Need help?' : '¿Necesitas ayuda?'}
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• {language === 'en' ? 'Contact our support team' : 'Contacta a nuestro equipo de soporte'}</li>
            <li>• {language === 'en' ? 'Check our FAQ section' : 'Revisa nuestra sección de FAQ'}</li>
            <li>• {language === 'en' ? 'Try a different payment method' : 'Prueba un método de pago diferente'}</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentCancel; 