const mysql = require('mysql2');

// ============================================
// CONFIGURACIÓN DE BASE DE DATOS
// ============================================
// IMPORTANTE: Actualiza estos valores con tus credenciales de MySQL
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',           // Cambia por tu usuario de MySQL
  password: '',            // ← CONTRASEÑA VACÍA (XAMPP/WAMP común)
  database: 'eglys_pasteleria',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones (mejor para múltiples requests)
const pool = mysql.createPool(DB_CONFIG);

// Promisificar el pool para usar async/await
const promisePool = pool.promise();

// Probar la conexión
pool.getConnection((err, connection) => {
  if (err) {
    console.log('❌ Error al conectar con la base de datos:');
    console.log(err);
  } else {
    console.log('✅ Conexión exitosa a la base de datos MySQL');
    connection.release();
  }
});

// Exportar el pool promisificado
module.exports = promisePool;


