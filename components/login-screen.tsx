'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LoginScreenProps {
  /** Called after a successful login response (HTTP-only cookie was set). */
  onAuthenticated: () => void;
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onAuthenticated();
      } else if (res.status === 401) {
        setError('Clave incorrecta');
      } else {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? 'Error inesperado');
      }
    } catch {
      setError('No se pudo contactar al servidor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('/ahegao.jpg')] bg-contain bg-no-repeat bg-center flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-zinc-100 text-center">Acceso</h1>
        <Input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          placeholder="Ingresa la clave"
          className="bg-zinc-800/90 border-zinc-700 text-zinc-200"
          disabled={submitting}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button
          onClick={handleLogin}
          className="w-full"
          disabled={submitting || !password}
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </div>
    </div>
  );
}
