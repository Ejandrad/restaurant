-- Base de datos y tablas (ejecutar contra tu instancia de PostgreSQL)
-- Crea el esquema de restaurante_ordenes_db
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  telefono VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS ordenes (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  plato VARCHAR(120) NOT NULL,
  extras VARCHAR(200),
  estado VARCHAR(20) NOT NULL DEFAULT 'created', -- created -> preparing -> delivered
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
