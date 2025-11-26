// server.js
const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

// Permitir lectura de formularios y JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir todos los archivos estáticos (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname)));

// Middleware para CORS (permitir requests del frontend)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// ========== ENDPOINTS API ==========

// POST /api/register - Registro de usuarios
app.post('/api/register', async (req, res) => {
  try {
    const { nombres, apellidos, telefono, correo, direccion, contraseña } = req.body;
    
    if (!nombres || !apellidos || !correo || !contraseña) {
      return res.status(400).json({ success: false, message: 'Complete los campos obligatorios' });
    }

    // Verificar si el correo ya existe
    const [existing] = await db.execute(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo.toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Este correo ya está registrado' });
    }

    // Insertar nuevo usuario
    const [result] = await db.execute(
      'INSERT INTO usuarios (nombres, apellidos, telefono, correo, direccion, contraseña) VALUES (?, ?, ?, ?, ?, ?)',
      [nombres, apellidos, telefono || null, correo.toLowerCase(), direccion || null, contraseña]
    );

    res.json({ 
      success: true, 
      message: 'Cuenta creada con éxito',
      userId: result.insertId 
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ success: false, message: 'Error al registrar usuario' });
  }
});

// POST /api/login - Inicio de sesión
app.post('/api/login', async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    if (!correo || !contraseña) {
      return res.status(400).json({ success: false, message: 'Correo y contraseña requeridos' });
    }

    const [users] = await db.execute(
      'SELECT id, nombres, apellidos, telefono, correo, direccion FROM usuarios WHERE correo = ? AND contraseña = ?',
      [correo.toLowerCase(), contraseña]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }

    const user = users[0];
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        telefono: user.telefono,
        correo: user.correo,
        direccion: user.direccion
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
  }
});

// GET /api/productos - Obtener productos (opcional: ?tipo=torta o ?tipo=evento)
app.get('/api/productos', async (req, res) => {
  try {
    const { tipo } = req.query;
    let query = 'SELECT * FROM productos';
    let params = [];

    if (tipo) {
      query += ' WHERE tipo = ?';
      params.push(tipo);
    }

    query += ' ORDER BY id';

    const [productos] = await db.execute(query, params);
    res.json({ success: true, productos });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
});

// POST /api/carrito - Agregar producto al carrito
app.post('/api/carrito', async (req, res) => {
  try {
    const { usuario_id, producto_id, cantidad } = req.body;

    if (!usuario_id || !producto_id) {
      return res.status(400).json({ success: false, message: 'usuario_id y producto_id requeridos' });
    }

    // Verificar si el producto ya está en el carrito
    const [existing] = await db.execute(
      'SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND producto_id = ?',
      [usuario_id, producto_id]
    );

    if (existing.length > 0) {
      // Actualizar cantidad
      const newQty = (existing[0].cantidad || 0) + (cantidad || 1);
      await db.execute(
        'UPDATE carrito SET cantidad = ? WHERE id = ?',
        [newQty, existing[0].id]
      );
    } else {
      // Insertar nuevo item
      await db.execute(
        'INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)',
        [usuario_id, producto_id, cantidad || 1]
      );
    }

    res.json({ success: true, message: 'Producto agregado al carrito' });
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({ success: false, message: 'Error al agregar al carrito' });
  }
});

// GET /api/carrito/:usuario_id - Obtener carrito del usuario
app.get('/api/carrito/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const [items] = await db.execute(
      `SELECT c.id, c.producto_id, c.cantidad, 
              p.nombre, p.precio, p.imagen, 
              (c.cantidad * p.precio) as subtotal
       FROM carrito c
       INNER JOIN productos p ON c.producto_id = p.id
       WHERE c.usuario_id = ?`,
      [usuario_id]
    );

    const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({ 
      success: true, 
      items: items.map(item => ({
        id: item.producto_id,
        nombre: item.nombre,
        precio: parseFloat(item.precio),
        cantidad: item.cantidad,
        subtotal: parseFloat(item.subtotal),
        imagen: item.imagen
      })),
      total: total
    });
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({ success: false, message: 'Error al obtener carrito' });
  }
});

// DELETE /api/carrito/:usuario_id/:producto_id - Eliminar producto del carrito
app.delete('/api/carrito/:usuario_id/:producto_id', async (req, res) => {
  try {
    const { usuario_id, producto_id } = req.params;

    await db.execute(
      'DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?',
      [usuario_id, producto_id]
    );

    res.json({ success: true, message: 'Producto eliminado del carrito' });
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar del carrito' });
  }
});

// POST /api/pedidos - Confirmar pedido
app.post('/api/pedidos', async (req, res) => {
  try {
    const { usuario_id } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ success: false, message: 'usuario_id requerido' });
    }

    // Obtener items del carrito
    const [items] = await db.execute(
      `SELECT c.producto_id, c.cantidad, p.precio
       FROM carrito c
       INNER JOIN productos p ON c.producto_id = p.id
       WHERE c.usuario_id = ?`,
      [usuario_id]
    );

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'Carrito vacío' });
    }

    // Calcular total
    const total = items.reduce((sum, item) => sum + (parseFloat(item.precio) * item.cantidad), 0);

    // Crear pedido
    const [pedidoResult] = await db.execute(
      'INSERT INTO pedidos (usuario_id, total, estado) VALUES (?, ?, ?)',
      [usuario_id, total, 'confirmado']
    );

    const pedido_id = pedidoResult.insertId;

    // Insertar items del pedido
    for (const item of items) {
      const subtotal = parseFloat(item.precio) * item.cantidad;
      await db.execute(
        'INSERT INTO items_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
        [pedido_id, item.producto_id, item.cantidad, item.precio, subtotal]
      );
    }

    // Limpiar carrito
    await db.execute('DELETE FROM carrito WHERE usuario_id = ?', [usuario_id]);

    res.json({ 
      success: true, 
      message: 'Pedido confirmado con éxito',
      pedido_id: pedido_id,
      total: total
    });
  } catch (error) {
    console.error('Error al confirmar pedido:', error);
    res.status(500).json({ success: false, message: 'Error al confirmar pedido' });
  }
});

// GET /api/pedidos/:usuario_id - Obtener pedidos del usuario
app.get('/api/pedidos/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const [pedidos] = await db.execute(
      'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY fecha_pedido DESC',
      [usuario_id]
    );

    res.json({ success: true, pedidos });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener pedidos' });
  }
});

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ingreso.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
