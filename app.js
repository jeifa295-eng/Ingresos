// ================= USERS =================
function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

function mostrarRegistro() {
    registroBox.style.display = "block";
}

function registrar() {
    let users = getUsers();

    let u = newUser.value;
    let p = newPass.value;

    if (!u || !p) return alert("Completa los campos");

    if (users.find(x => x.user === u)) {
        return alert("Usuario ya existe");
    }

    users.push({ user: u, pass: p });
    saveUsers(users);

    alert("Usuario creado ✅");
}

// ================= LOGIN =================
function login() {
    let users = getUsers();

    let u = user.value;
    let p = pass.value;

    let encontrado = users.find(x => x.user === u && x.pass === p);

    if (encontrado) {
        localStorage.setItem("session", u);
        mostrarApp();
    } else {
        alert("Datos incorrectos");
    }
}

function logout() {
    localStorage.removeItem("session");
    location.reload();
}

function getUser() {
    return localStorage.getItem("session");
}

function mostrarApp() {
    loginView.style.display = "none";
    appView.style.display = "block";
    cargar();
}

window.onload = () => {
    if (getUser()) mostrarApp();
};

// ================= DATA =================
function getData() {
    let user = getUser();
    return JSON.parse(localStorage.getItem("finanzas_" + user)) || [];
}

function saveData(data) {
    let user = getUser();
    localStorage.setItem("finanzas_" + user, JSON.stringify(data));
}

// ================= MOVIMIENTOS =================
function agregarIngreso() {
    let data = getData();

    let monto = parseFloat(ingresoMonto.value);
    let cuenta = ingresoCuenta.value;

    if (!monto || monto <= 0) return alert("Monto inválido");

    data.push({
        id: Date.now(),
        tipo: "ingreso",
        monto,
        cuenta,
        fecha: new Date().toISOString().slice(0,7)
    });

    saveData(data);
    cargar();
}

function agregarGasto() {
    let data = getData();

    let monto = parseFloat(gastoMonto.value);
    let categoria = gastoCategoria.value;

    if (!monto || monto <= 0) return alert("Monto inválido");

    data.push({
        id: Date.now(),
        tipo: "gasto",
        monto,
        categoria,
        fecha: new Date().toISOString().slice(0,7)
    });

    saveData(data);
    cargar();
}

function eliminar(id) {
    let data = getData().filter(i => i.id !== id);
    saveData(data);
    cargar();
}

// ================= MODAL =================
let editId = null;

function editar(id) {
    let data = getData();
    let item = data.find(i => i.id === id);

    editId = id;

    editMonto.value = item.monto;
    editExtra.value = item.tipo === "gasto" ? item.categoria : item.cuenta;

    modal.style.display = "flex";
}

function cerrarModal() {
    modal.style.display = "none";
}

function guardarEdicion() {
    let data = getData();
    let item = data.find(i => i.id === editId);

    item.monto = parseFloat(editMonto.value);

    if (item.tipo === "gasto") {
        item.categoria = editExtra.value;
    } else {
        item.cuenta = editExtra.value;
    }

    saveData(data);
    cerrarModal();
    cargar();
}

// ================= UI =================
function cargar() {
    let data = getData();

    let ingresos = 0;
    let gastos = 0;
    let lista = document.getElementById("lista");
    lista.innerHTML = "";

    let filtro = document.getElementById("filtroMes").value;

    let resumenMes = {};

    data.forEach(i => {

        if (filtro && i.fecha !== filtro) return;

        if (i.tipo === "ingreso") ingresos += i.monto;
        if (i.tipo === "gasto") gastos += i.monto;

        let mes = i.fecha;
        if (!resumenMes[mes]) resumenMes[mes] = {ingresos:0, gastos:0};

        if (i.tipo === "ingreso") resumenMes[mes].ingresos += i.monto;
        if (i.tipo === "gasto") resumenMes[mes].gastos += i.monto;

        let li = document.createElement("li");
        li.innerHTML = `
          ${i.tipo} - $${i.monto}
          <div>
            <button onclick="editar(${i.id})">✏️</button>
            <button class="delete" onclick="eliminar(${i.id})">❌</button>
          </div>
        `;
        lista.appendChild(li);
    });

    let balance = ingresos - gastos;

    document.getElementById("balance").textContent =
        balance.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP"
        });

    let meses = Object.keys(resumenMes);
    let ingresosData = meses.map(m => resumenMes[m].ingresos);
    let gastosData = meses.map(m => resumenMes[m].gastos);

    if (window.chart) window.chart.destroy();

    window.chart = new Chart(grafica, {
        type: "bar",
        data: {
            labels: meses,
            datasets: [
                {label: "Ingresos", data: ingresosData},
                {label: "Gastos", data: gastosData}
            ]
        }
    });
}