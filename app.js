// 🔥 CONFIG FIREBASE (coloque a sua)
  const firebaseConfig = {
    apiKey: "AIzaSyCnNJX7Y3CNxXak9SnftTBcXV3hkj4g1ag",
    authDomain: "jogo-cooperativas.firebaseapp.com",
    projectId: "jogo-cooperativas",
    storageBucket: "jogo-cooperativas.firebasestorage.app",
    messagingSenderId: "641682053842",
    appId: "1:641682053842:web:a9de8c738ac7d7bed62b0b"
  };

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// =========================
// VARIÁVEIS
// =========================
let jogadorId = null;
let nomeJogador = "";
let tipoJogador = "";
let dinheiro = 0;

let ultimoTempoFusao = 0;
const TEMPO_FUSAO = 60000;

// =========================
// REGISTRAR
// =========================
async function registrar() {
  const email = emailInput();
  const senha = senhaInput();
  const nome = nomeInput();
  const tipo = tipoInput();

  const user = await auth.createUserWithEmailAndPassword(email, senha);
  jogadorId = user.user.uid;

  nomeJogador = nome;
  tipoJogador = tipo;
  dinheiro = 1000;

  await db.collection("cooperativas").doc(jogadorId).set({
    nome, tipo, dinheiro,
    online: true,
    criadoEm: Date.now(),
    ultimaFusao: 0
  });

  entrarNoJogo();
}

// =========================
// LOGIN
// =========================
async function login() {
  const user = await auth.signInWithEmailAndPassword(emailInput(), senhaInput());

  jogadorId = user.user.uid;

  const doc = await db.collection("cooperativas").doc(jogadorId).get();
  const data = doc.data();

  nomeJogador = data.nome;
  tipoJogador = data.tipo;
  dinheiro = data.dinheiro;
  ultimoTempoFusao = data.ultimaFusao || 0;

  await db.collection("cooperativas").doc(jogadorId).update({
    online: true
  });

  entrarNoJogo();
}

// =========================
// UI
// =========================
function entrarNoJogo() {
  document.getElementById("login").style.display = "none";
  document.getElementById("jogo").style.display = "block";

  atualizarTela();

  escutarCooperativas();
  escutarOnline();
  escutarRanking();
  escutarEventos();

  notificarEntrada(nomeJogador);
  iniciarEventos();
}

function atualizarTela() {
  titulo().innerText = `${nomeJogador} (${tipoJogador})`;
  dinheiroUI().innerText = `💰 R$ ${dinheiro}`;
}

// =========================
// TEMPO REAL
// =========================
function escutarCooperativas() {
  db.collection("cooperativas").onSnapshot((snap) => {
    let html = "";

    snap.forEach(doc => {
      const c = doc.data();
      if (doc.id !== jogadorId) {
        html += `
        <div class="card">
          <b>${c.nome}</b><br>
          ${c.tipo}<br>
          💰 ${c.dinheiro}
          <button onclick="fundir('${doc.id}')">Fusão</button>
        </div>`;
      }
    });

    lista().innerHTML = html;
  });
}

function escutarOnline() {
  db.collection("cooperativas").onSnapshot((snap) => {
    let html = "";
    snap.forEach(doc => {
      const c = doc.data();
      if (c.online) html += `<div>🟢 ${c.nome}</div>`;
    });
    online().innerHTML = html;
  });
}

function escutarRanking() {
  db.collection("cooperativas")
    .orderBy("dinheiro", "desc")
    .onSnapshot((snap) => {

      let html = "";
      let pos = 1;

      snap.forEach(doc => {
        const c = doc.data();
        html += `<div>#${pos} - ${c.nome} 💰 ${c.dinheiro}</div>`;
        pos++;
      });

      ranking().innerHTML = html;
    });
}

// =========================
// FUSÃO COM COOLDOWN
// =========================
async function fundir(idOutro) {

  const agora = Date.now();

  if (agora - ultimoTempoFusao < TEMPO_FUSAO) {
    const restante = Math.ceil((TEMPO_FUSAO - (agora - ultimoTempoFusao)) / 1000);
    alert(`⏳ Aguarde ${restante}s`);
    return;
  }

  const novoNome = prompt("Nome da nova cooperativa:");
  if (!novoNome) return;

  const outra = (await db.collection("cooperativas").doc(idOutro).get()).data();

  const valores = {
    "Transporte": 400,
    "Saúde": 600,
    "Agropecuário": 500,
    "Financeira": 700,
    "Consumo": 450,
    "Infraestrutura": 650,
    "Trabalho e Serviços": 500
  };

  let ganho = valores[tipoJogador] || 400;

  if (tipoJogador === outra.tipo) ganho += 300;

  dinheiro += ganho;
  ultimoTempoFusao = agora;

  await db.collection("cooperativas").doc(jogadorId).update({
    nome: novoNome,
    dinheiro,
    ultimaFusao: agora
  });

  db.collection("eventos").add({
    texto: `🤝 ${nomeJogador} fundiu com ${outra.nome}`,
    tempo: Date.now()
  });

  atualizarTela();
}

// =========================
// EVENTOS
// =========================
function iniciarEventos() {
  setInterval(async () => {

    const eventos = [
      { texto: "📉 Crise econômica", valor: -200 },
      { texto: "📈 Boom de mercado", valor: 300 }
    ];

    const e = eventos[Math.random() * eventos.length | 0];

    dinheiro += e.valor;

    await db.collection("cooperativas").doc(jogadorId).update({ dinheiro });

    db.collection("eventos").add({
      texto: `${nomeJogador}: ${e.texto}`,
      tempo: Date.now()
    });

    atualizarTela();

  }, 10000);
}

// =========================
// NOTIFICAÇÃO
// =========================
function notificarEntrada(nome) {
  db.collection("eventos").add({
    texto: `🚀 ${nome} entrou`,
    tempo: Date.now()
  });
}

function escutarEventos() {
  db.collection("eventos")
    .orderBy("tempo", "desc")
    .limit(5)
    .onSnapshot((snap) => {

      let html = "";
      snap.forEach(doc => html += `<div>${doc.data().texto}</div>`);

      eventosUI().innerHTML = html;
    });
}

// =========================
// HELPERS
// =========================
const emailInput = () => document.getElementById("email").value;
const senhaInput = () => document.getElementById("senha").value;
const nomeInput = () => document.getElementById("nome").value;
const tipoInput = () => document.getElementById("tipo").value;

const titulo = () => document.getElementById("titulo");
const dinheiroUI = () => document.getElementById("dinheiro");
const lista = () => document.getElementById("lista");
const online = () => document.getElementById("online");
const ranking = () => document.getElementById("ranking");
const eventosUI = () => document.getElementById("eventos");

// =========================
// OFFLINE
// =========================
window.addEventListener("beforeunload", async () => {
  if (jogadorId) {
    await db.collection("cooperativas").doc(jogadorId).update({
      online: false
    });
  }
});
