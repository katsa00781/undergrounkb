import { useState } from 'react';
import { supabase } from '../config/supabase';
import { type User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const TestAuth = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const signUp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('User created successfully');
        setUser(data.user);
      }
    } catch {
      toast.error('Error creating user');
    }
    setLoading(false);
  };

  const signIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Signed in successfully');
        setUser(data.user);
      }
    } catch {
      toast.error('Error signing in');
    }
    setLoading(false);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed out');
      setUser(null);
    }
  };

  const createTestWeight = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    try {
      // Create multiple test weights with different dates
      const testWeights = [
        { weight: 85.5, date: '2024-05-29' }, // 1 month ago
        { weight: 86.0, date: '2024-06-15' }, // 2 weeks ago  
        { weight: 85.8, date: new Date().toISOString().split('T')[0] }, // today
      ];

      for (const weightData of testWeights) {
        const { data, error } = await supabase
          .from('user_weights')
          .insert({
            user_id: user.id,
            weight: weightData.weight,
            date: weightData.date,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating weight:', error);
          toast.error('Error creating weight: ' + error.message);
          return;
        } else {
          console.log('Created weight:', data);
        }
      }
      
      toast.success('Test weights created successfully!');
    } catch {
      toast.error('Error creating test weights');
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Test Authentication</h1>
      
      <div className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading}
          />
        </div>
        
        <div className="space-x-2">
          <button
            onClick={signUp}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Sign Up
          </button>
          
          <button
            onClick={signIn}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Sign In
          </button>
          
          <button
            onClick={signOut}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Sign Out
          </button>
        </div>

        {user && (
          <div className="mt-4 space-y-2">
            <p className="text-green-600">Signed in as: {user.email}</p>
            <button
              onClick={createTestWeight}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Create Test Weights (3 entries)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAuth;
