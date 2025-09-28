const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/restaurante_ordenes_db';
const useSSL = /\brender\.com\b/i.test(connectionString) || /\bsslmode=require\b/i.test(connectionString) || process.env.PGSSLMODE === 'require';
const pool = new Pool({ connectionString, ssl: useSSL ? { rejectUnauthorized: false } : false });

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(120) UNIQUE NOT NULL,
      telefono VARCHAR(30) NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ordenes (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      plato VARCHAR(120) NOT NULL,
      extras VARCHAR(200),
      estado VARCHAR(20) NOT NULL DEFAULT 'created',
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('DB lista');
}
init().catch(err => {
  console.error('Error al inicializar la DB', err);
  process.exit(1);
});

app.get('/health', (req,res)=> res.json({ok:true}));

app.post('/clientes/registrar', async (req, res) => {
  try {
    const { nombre, email, telefono } = req.body || {};
    if (!nombre || !email || !telefono) return res.status(400).json({error:'Faltan campos'});
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({error:'Email inválido'});
    const q = `INSERT INTO clientes(nombre,email,telefono) VALUES ($1,$2,$3) RETURNING id,nombre,email,telefono`;
    const { rows } = await pool.query(q, [nombre.trim(), email.trim().toLowerCase(), String(telefono).trim()]);
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e && e.code === '23505') return res.status(409).json({error:'Email ya registrado'});
    console.error(e);
    res.status(500).json({error:'Error del servidor'});
  }
});

app.post('/clientes/login', async (req, res) => {
  try {
    const { email, telefono } = req.body || {};
    if (!email || !telefono) return res.status(400).json({error:'Faltan credenciales'});
    const q = `SELECT id,nombre,email,telefono FROM clientes WHERE email=$1 AND telefono=$2`;
    const { rows } = await pool.query(q, [email.trim().toLowerCase(), String(telefono).trim()]);
    if (rows.length === 0) return res.status(401).json({error:'Credenciales inválidas'});
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({error:'Error del servidor'});
  }
});

app.post('/ordenes', async (req, res) => {
  try {
    const { cliente_id, plato, extras } = req.body || {};
    if (!cliente_id || !plato) return res.status(400).json({error:'Faltan datos'});
    const q = `INSERT INTO ordenes(cliente_id, plato, extras) VALUES ($1,$2,$3) RETURNING *`;
    const { rows } = await pool.query(q, [cliente_id, plato.trim(), extras ? String(extras).trim() : null]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({error:'Error del servidor'});
  }
});

app.get('/ordenes/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const q = `SELECT * FROM ordenes WHERE cliente_id=$1 ORDER BY id DESC`;
    const { rows } = await pool.query(q, [clienteId]);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({error:'Error del servidor'});
  }
});

app.patch('/ordenes/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`SELECT estado FROM ordenes WHERE id=$1`, [id]);
    if (rows.length === 0) return res.status(404).json({error:'Orden no encontrada'});
    const actual = rows[0].estado;
    let next = actual;
    if (actual === 'created') next = 'preparing';
    else if (actual === 'preparing') next = 'delivered';
    const upd = await pool.query(`UPDATE ordenes SET estado=$1 WHERE id=$2 RETURNING *`, [next, id]);
    res.json(upd.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({error:'Error del servidor'});
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

