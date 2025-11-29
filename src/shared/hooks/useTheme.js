import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      // Si no hay guardado, detectamos sistema, pero luego lo manejamos manualmente
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // 1. Limpiamos cualquier rastro previo
    root.classList.remove('light', 'dark');
    
    // 2. Agregamos la clase actual
    root.classList.add(theme);
    
    // 3. Guardamos
    localStorage.setItem('theme', theme);
    
    // DEBUG: Abre la consola (F12) y mira si esto cambia al hacer click
    console.log('Tema cambiado a:', theme);
    
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}