import React, { useState, useEffect } from 'react';

interface CaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onFailed: () => void;
  remainingTime?: number;
}

const CaptchaModal: React.FC<CaptchaModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onFailed,
  remainingTime 
}) => {
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  // Basit matematik captcha oluştur
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    switch (operation) {
      case '+': {
        const answer = num1 + num2;
        const question = `${num1} + ${num2}`;
        setCaptchaQuestion(question);
        setCaptchaAnswer(answer.toString());
        break;
      }
      case '-': {
        const answer = Math.max(num1, num2) - Math.min(num1, num2);
        const question = `${Math.max(num1, num2)} - ${Math.min(num1, num2)}`;
        setCaptchaQuestion(question);
        setCaptchaAnswer(answer.toString());
        break;
      }
      case '×': {
        const smallNum1 = Math.floor(Math.random() * 10) + 1;
        const smallNum2 = Math.floor(Math.random() * 10) + 1;
        const answer = smallNum1 * smallNum2;
        const question = `${smallNum1} × ${smallNum2}`;
        setCaptchaQuestion(question);
        setCaptchaAnswer(answer.toString());
        break;
      }
      default: {
        const answer = num1 + num2;
        const question = `${num1} + ${num2}`;
        setCaptchaQuestion(question);
        setCaptchaAnswer(answer.toString());
      }
    }
  };

  // Modal açıldığında yeni captcha oluştur
  useEffect(() => {
    if (isOpen) {
      console.log('Captcha modal açıldı, yeni captcha oluşturuluyor...');
      generateCaptcha();
      setUserAnswer('');
      setError('');
      setAttempts(0);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Captcha cevabı kontrol ediliyor...', {
      userAnswer: userAnswer.trim(),
      correctAnswer: captchaAnswer,
      isCorrect: userAnswer.trim() === captchaAnswer
    });
    
    if (userAnswer.trim() === captchaAnswer) {
      console.log('Captcha doğru! Success callback çağrılıyor...');
      setError('');
      onSuccess();
      onClose();
    } else {
      const newAttempts = attempts + 1;
      console.log(`Captcha yanlış! Deneme ${newAttempts}/${maxAttempts}`);
      setAttempts(newAttempts);
      
      if (newAttempts >= maxAttempts) {
        console.log('Maksimum deneme aşıldı, IP engellenecek...');
        setError(`3 yanlış deneme! IP adresiniz 5 dakika engellenecek.`);
        setTimeout(() => {
          onFailed();
          onClose();
        }, 2000);
      } else {
        setError(`Yanlış cevap! ${maxAttempts - newAttempts} hakkınız kaldı.`);
        generateCaptcha(); // Yeni soru oluştur
        setUserAnswer('');
      }
    }
  };

  const handleReset = () => {
    generateCaptcha();
    setUserAnswer('');
    setError('');
  };

  if (!isOpen) return null;

  // Engellenmiş kullanıcı için farklı modal
  if (remainingTime) {
    const minutes = Math.ceil(remainingTime / 60000);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="text-center">
            <div className="text-6xl text-red-500 mb-4">🚫</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Erişim Engellendi</h2>
            <p className="text-gray-600 mb-4">
              Çok fazla deneme yaptığınız için erişiminiz geçici olarak engellendi.
            </p>
            <p className="text-lg font-semibold text-red-600 mb-6">
              Kalan süre: ~{minutes} dakika
            </p>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center mb-6">
          <div className="text-6xl text-yellow-500 mb-4">🤖</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Güvenlik Doğrulaması</h2>
          <p className="text-gray-600">
            Çok hızlı istek gönderiyorsunuz. Lütfen aşağıdaki soruyu cevaplayın.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">Aşağıdaki işlemin sonucunu yazın:</p>
            <div className="text-2xl font-bold text-gray-900 mb-4">
              {captchaQuestion} = ?
            </div>
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="?"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={!userAnswer.trim() || attempts >= maxAttempts}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors font-medium"
            >
              Doğrula
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
              disabled={attempts >= maxAttempts}
            >
              Yenile
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Deneme: {attempts}/{maxAttempts}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaptchaModal;
