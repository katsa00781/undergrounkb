import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { exchangePolarCode, verifyPolarState } from '../lib/polarService';

// A Polar OAuth2 visszairányítás kezelése: kiolvassa a code+state-et,
// beváltja a tokent az Edge Functionön keresztül, majd visszanavigál a profilra.
const PolarCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [message, setMessage] = useState('Polar fiók összekötése folyamatban...');
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const polarError = searchParams.get('error');

    const finishWithError = (msg: string) => {
      setStatus('error');
      setMessage(msg);
      toast.error(msg);
    };

    if (polarError) {
      finishWithError('A Polar összekötést megszakítottad vagy elutasítottad.');
      return;
    }

    if (!code) {
      finishWithError('Hiányzó authorization code a Polar válaszából.');
      return;
    }

    if (!verifyPolarState(state)) {
      finishWithError('Érvénytelen állapot (state). Próbáld újra az összekötést.');
      return;
    }

    exchangePolarCode(code)
      .then(() => {
        toast.success('Polar fiók sikeresen összekötve!');
        navigate('/profile', { replace: true });
      })
      .catch((err) => {
        finishWithError(
          err instanceof Error ? err.message : 'A Polar összekötés sikertelen.',
        );
      });
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        {status === 'processing' ? (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
          </>
        ) : (
          <>
            <p className="text-error-600 dark:text-error-400">{message}</p>
            <button
              onClick={() => navigate('/profile', { replace: true })}
              className="btn btn-primary mt-4"
            >
              Vissza a profilhoz
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PolarCallback;
