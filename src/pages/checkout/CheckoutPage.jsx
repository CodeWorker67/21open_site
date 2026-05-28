import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { paymentApi } from '@services/api';
import useAuthStore from '@stores/authStore';
import { ROUTES, TARIFFS, BRAND_NAME } from '@utils/constants';
import Button from '@components/ui/Button';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState('creating'); // creating | error
  const [errorMsg, setErrorMsg] = useState('');

  const tariffId = searchParams.get('tariff');
  const method = searchParams.get('method');
  const isGift = searchParams.get('gift') === '1';

  useEffect(() => {
    if (!isAuthenticated) {
      toast('Войдите, чтобы оплатить', { icon: '🔑' });
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!tariffId || !method) {
      navigate(ROUTES.PRICING);
      return;
    }

    const tariff = TARIFFS.find(t => t.id === tariffId);
    if (!tariff || !['sbp', 'card'].includes(method)) {
      navigate(ROUTES.PRICING);
      return;
    }

    let cancelled = false;

    paymentApi.createPayment({ tariff_id: tariffId, method, is_gift: isGift })
      .then(({ data }) => {
        if (cancelled) return;
        if (data.payment_url) {
          window.location.href = data.payment_url;
        } else {
          setStatus('error');
          setErrorMsg('Не удалось получить ссылку на оплату');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        setErrorMsg(err.response?.data?.detail || 'Ошибка при создании платежа');
      });

    return () => { cancelled = true; };
  }, [tariffId, method, isGift, isAuthenticated, navigate]);

  const tariff = TARIFFS.find(t => t.id === tariffId);

  return (
    <>
      <Helmet><title>Оплата — {BRAND_NAME}</title></Helmet>
      <section className="py-20 min-h-screen flex items-center justify-center">
        <div className="card-dark max-w-md mx-4 text-center">
          {status === 'creating' && (
            <>
              <Loader2 className="w-12 h-12 text-zoomer-neon mx-auto mb-4 animate-spin" />
              <h1 className="text-xl font-bold text-white mb-2">Создаём платёж</h1>
              <p className="text-gray-400 text-sm">
                {tariff ? `${tariff.label} — ${tariff.price} руб` : 'Загрузка...'}
              </p>
              <p className="text-gray-500 text-xs mt-4">
                Сейчас перенаправим на страницу оплаты...
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="text-xl font-bold text-white mb-2">Ошибка</h1>
              <p className="text-red-400 text-sm mb-6">{errorMsg}</p>
              <Button onClick={() => navigate(ROUTES.PRICING)} className="w-full">
                Вернуться к тарифам
              </Button>
            </>
          )}
        </div>
      </section>
    </>
  );
}
