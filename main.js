/* main.js - lógica compartida */

// Datos de ejemplo de productos
const PRODUCTS = [
    {id:1, tipo:'torta', name:'Torta frutal', price:30000, desc:'Suave bizcocho relleno de crema ligera y coronado con una vibrante selección de frutas frescas de temporada.', img:'img/frutas.jpg'},
    {id:2, tipo:'torta', name:'Torta sol amarillo', price:30000, desc:'Bizcocho esponjoso con un delicioso toque cítrico, usualmente de naranja o limón, bañado con un glaseado brillante de color amarillo', img:'img/amarillo.png'},
    {id:3, tipo:'torta', name:'Torta chocolate', price:30000, desc:'Intenso y húmedo bizcocho de chocolate, con un rico relleno y cubierto por una cremosa ganache o frosting de chocolate.', img:'img/chocolate.jpg'},
    {id:4, tipo:'evento', name:'Fiesta Rosa', price:230000, desc:'Ideal para celebrar quinceañeras, baby showers o cumpleaños con un ambiente suave, femenino y elegante, donde el color rosa es el protagonista de la decoración y el dress code', img:'img/rosa.jpg'},
    {id:5, tipo:'evento', name:'Fiesta Matrimonio', price:300000, desc:'El evento más importante para la pareja, donde los detalles, la elegancia y la emoción se unen para festejar el inicio de su vida juntos, con una atmósfera de solemnidad y gran alegría.', img:'img/matrimonio.jpeg'},
    {id:6, tipo:'evento', name:'Fiesta Dorada', price:200000, desc:'Un tema que evoca lujo, distinción y éxito. Es perfecta para grandes aniversarios, graduaciones importantes o eventos corporativos que buscan impactar con sofisticación y glamour.', img:'img/dorado.jpg'}
  ];
  
  // ---------- helpers para localStorage ----------
  function getUsers(){ return JSON.parse(localStorage.getItem('users') || '[]'); }
  function saveUsers(users){ localStorage.setItem('users', JSON.stringify(users)); }
  function getCart(){ return JSON.parse(localStorage.getItem('cart') || '[]'); }
  function saveCart(cart){ localStorage.setItem('cart', JSON.stringify(cart)); }
  function getCurrentUser(){ return JSON.parse(localStorage.getItem('currentUser') || 'null'); }
  function setCurrentUser(user){ localStorage.setItem('currentUser', JSON.stringify(user)); }
  function clearCurrentUser(){ localStorage.removeItem('currentUser'); }
  
  // ---------- registro ----------
  function registerUser(form){
    const nombres = form.nombres.value.trim();
    const apellidos = form.apellidos.value.trim();
    const telefono = form.telefono.value.trim();
    const correo = form.correo.value.trim().toLowerCase();
    const direccion = form.direccion.value.trim();
    const contraseña = form.contraseña.value;
    if(!nombres || !apellidos || !correo || !contraseña){ alert('Complete los campos obligatorios'); return false; }
    const users = getUsers();
    if(users.find(u=>u.correo === correo)){ alert('Este correo ya está registrado'); return false; }
    users.push({nombres,apellidos,telefono,correo,direccion,contraseña});
    saveUsers(users);
    alert('Cuenta creada con éxito. Ahora inicia sesión.');
    window.location.href = 'ingreso.html';
    return true;
  }
  
  // ---------- login ----------
  function loginUser(form){
    const correo = form.usuario.value.trim().toLowerCase();
    const contraseña = form.contraseña.value;
    const users = getUsers();
    const user = users.find(u => u.correo === correo && u.contraseña === contraseña);
    if(!user){ alert('Usuario o contraseña incorrectos'); return false; }
    setCurrentUser(user);
    window.location.href = 'servicio.html';
    return true;
  }
  
  // ---------- proteger páginas que requieren login ----------
  function requireLogin(redirectTo='ingreso.html'){
    const user = getCurrentUser();
    if(!user){ window.location.href = redirectTo; return false; }
    return true;
  }
  
  // ---------- mostrar productos filtrados por tipo ----------
  function renderProducts(containerId, tipo){
    const cont = document.getElementById(containerId);
    if(!cont) return;
    cont.innerHTML = '';
    const list = PRODUCTS.filter(p => p.tipo === tipo);
    list.forEach(p=>{
      const div = document.createElement('div');
      div.className = 'product';
      div.innerHTML = `
        <img src="${p.img}" alt="${p.name}" onerror="this.style.display='none'"/>
        <strong>${p.name}</strong>
        <div class="small">${p.desc}</div>
        <div class="space-between" style="margin-top:8px">
          <div class="small"><strong>$${p.price.toLocaleString()}</strong></div>
          <button class="link-btn" onclick="addToCart(${p.id})">Seleccionar</button>
        </div>
      `;
      cont.appendChild(div);
    });
  }
  
  // ---------- carrito ----------
  function addToCart(productId){
    const p = PRODUCTS.find(x=>x.id===productId);
    if(!p) return;
    const cart = getCart();
    const existing = cart.find(i=>i.id===productId);
    if(existing) existing.qty++;
    else cart.push({id:p.id,name:p.name,price:p.price,qty:1});
    saveCart(cart);
    window.location.href = 'detalle-pedido.html';
  }
  
  function renderCart(containerId){
    const cont = document.getElementById(containerId);
    if(!cont) return;
    const cart = getCart();
    cont.innerHTML = '';
    if(cart.length === 0){ cont.innerHTML = '<div class="card">No hay productos en el carrito.</div>'; return; }
    let total = 0;
    const list = document.createElement('div');
    list.className = 'cart-list';
    cart.forEach(item=>{
      total += item.price * item.qty;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `<div>${item.name} x ${item.qty}</div><div>$${(item.price*item.qty).toLocaleString()}</div>`;
      list.appendChild(div);
    });
    const tot = document.createElement('div');
    tot.className = 'card';
    tot.innerHTML = `<div class="space-between"><strong>Total</strong><strong>$${total.toLocaleString()}</strong></div>`;
    cont.appendChild(list);
    cont.appendChild(tot);
  }
  
  // confirmar pedido
  function confirmOrder(){
    const user = getCurrentUser();
    if(!user){ alert('Debes iniciar sesión para confirmar pedido'); window.location.href = 'ingreso.html'; return; }
    const cart = getCart();
    if(cart.length === 0){ alert('Carrito vacío'); return; }
    // Guardamos "orden" en localStorage como ejemplo
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push({user: {correo:user.correo, nombres:user.nombres}, cart, date: new Date().toISOString()});
    localStorage.setItem('orders', JSON.stringify(orders));
    // limpiar carrito
    localStorage.removeItem('cart');
    alert('Pedido confirmado (simulación). ¡Gracias!');
    window.location.href = 'servicio.html';
  }
  
  // logout simple
  function logout(){
    clearCurrentUser();
    window.location.href = 'ingreso.html';
  }
  