import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validateInvite, acceptInvite, PendingInvite } from '../lib/invites';
import toast from 'react-hot-toast';

export const InviteAccept: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [invite, setInvite] = useState<PendingInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  useEffect(() => {
    const checkInvite = async () => {
      if (!token) {
        toast.error('Érvénytelen meghívó link');
        navigate('/');
        return;
      }

      try {
        const inviteData = await validateInvite(token);
        if (!inviteData) {
          toast.error('Érvénytelen vagy lejárt meghívó');
          navigate('/');
          return;
        }

        setInvite(inviteData);
        setFormData(prev => ({
          ...prev,
          displayName: inviteData.email.split('@')[0]
        }));
      } catch (error) {
        console.error('Error validating invite:', error);
        toast.error('Hiba a meghívó ellenőrzése során');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkInvite();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !invite) {
      toast.error('Érvénytelen meghívó');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('A jelszavak nem egyeznek');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A jelszó minimum 6 karakter hosszú legyen');
      return;
    }

    try {
      setSubmitting(true);
      
      await acceptInvite(
        token, 
        formData.password, 
        formData.displayName.trim() || undefined
      );
      
      // Sikeres regisztráció után átirányítjuk a bejelentkezési oldalra
      navigate('/login', { 
        state: { 
          message: 'Sikeres regisztráció! Most jelentkezz be az új fiókkal.',
          email: invite.email
        }
      });
      
    } catch (error) {
      console.error('Error accepting invite:', error);
      // A toast üzenetet az acceptInvite függvény már kezeli
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Meghívó ellenőrzése...</p>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Érvénytelen meghívó</h1>
          <p className="text-gray-600 mb-6">A meghívó érvénytelen vagy lejárt.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Vissza a főoldalra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Fiók létrehozása
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Meghívást kaptál a következő email címre:
          </p>
          <p className="text-center text-lg font-medium text-blue-600">
            {invite.email}
          </p>
          <p className="text-center text-sm text-gray-500">
            Szerepkör: <span className="font-medium">{invite.role === 'admin' ? 'Admin' : 'Felhasználó'}</span>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Megjelenítési név
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Adj meg egy megjelenítési nevet"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Jelszó
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Minimum 6 karakter"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Jelszó megerősítése
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Jelszó ismétlése"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fiók létrehozása...
                </>
              ) : (
                'Fiók létrehozása'
              )}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              A meghívó {new Date(invite.expires_at).toLocaleDateString('hu-HU')} napig érvényes.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteAccept;
