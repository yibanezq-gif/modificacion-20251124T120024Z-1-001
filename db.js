const mysql = require('mysql2');

// Crear la conexión
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456', 
  database: 'eglys_pasteleria'
});

// Intentar conectar
db.connect((err) => {
  if (err) {
    console.log('❌ Error al conectar con la base de datos:');
    console.log(err);
  } else {
    console.log('✅ Conexión exitosa a la base de datos MySQL');
  }
});

// Exportar la conexión para usarla en otros archivos
module.exports = db;

