// src/app/NotFound.tsx


export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>404 - Página No Encontrada</h1>
      <p>Lo sentimos, la página que buscas no existe.</p>
      <input type="button" value="Volver al Inicio" onClick={() => window.location.href = "/"} className="mt-5 cursor-pointer rounded-lg p-2 text-white bg-primary-500" />
    </div>
  );
}
