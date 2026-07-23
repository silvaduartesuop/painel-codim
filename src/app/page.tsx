'use client';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    window.location.replace('/painel.html');
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontFamily: 'sans-serif', color: '#6b7280', fontSize: 16 }}>
      Carregando painel...
    </div>
  );
}
