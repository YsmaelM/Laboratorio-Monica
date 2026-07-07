// src/app/NotFound.tsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>404 - Página No Encontrada</h1>
      <p>Lo sentimos, la página que buscas no existe.</p>
      <Link to="/">Volver al Inicio</Link>
    </div>
  );
}
