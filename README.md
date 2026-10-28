# Frontend de compras

Interfaz React para la API de `compras_back`.

## Iniciar

Primero inicia el backend desde `compras_back` con el Python del entorno virtual:

```powershell
.\.venv\Scripts\python.exe run.py
```

En otra terminal, desde `compras_front`:

```powershell
npm install
npm run dev
```

Abre `http://127.0.0.1:5173`. La URL del backend está en `.env` como `VITE_API_URL`. Si cambias esa URL, reinicia Vite.

La pantalla permite agregar, listar, editar, marcar como comprado y eliminar elementos. Los precios están en bolivianos; `unit` representa la unidad de medida, por ejemplo `unidad` o `kg`.

