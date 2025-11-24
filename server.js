// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Permitir lectura de formularios y JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir todos los archivos estáticos (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname)));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ingreso.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
