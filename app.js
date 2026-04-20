let jogadorId = null;
let nomeJogador = "";
let tipoJogador = "";
let dinheiro = 0;

/* =========================
   🔐 REGISTRAR
========================= */
async function registrar() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const nome = document.getElementById("nome").value;
  const tipo = document.getElementById("tipo").value;

  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, senha);
    const user = userCred.user;

    jogadorId = user.uid;
    nomeJogador = nome;
    tipoJogador = tipo;
    dinheiro = 1000;

    await db.collection("cooperativas").doc(jogadorId).set({
      nome,
      tipo,
      dinheiro,
      online: true,
      criadoEm: Date.now()
    });

    entrarNoJogo();

  } catch (e) {
    alert("Erro: " + e.message);
  }
}

/* =========================
   🔓 LOGIN
========================= */
async function login() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    const userCred = await auth.signInWithEmailAndPassword(email, senha);
    const user = userCred.user;

    jogadorId = user.uid;

    const doc = await db.collection("cooperativas")
      .doc(jogadorId)
      .get();

    const data = doc.data();

    nomeJogador = data.nome;
    tipoJogador = data.tipo;
    dinheiro = data.dinheiro;

    await db.collection("cooperativas").doc(jogadorId).update({
      online: true
    });

    entrarNoJogo();

  } catch (e) {
    alert("Erro: " + e.message);
  }
}

/* =========================
   🚪 ENTRAR NO JOGO
========================= */
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

/* =========================
   🔄 ATUALIZAR TELA
========================= */
function atualizarTela() {
  document.getElementById("titulo").innerText =
    nomeJogador + " (" + tipoJogador + ")";
  document.getElementById("dinheiro").innerText =
    "💰 R$ " + dinheiro;
}

/* =========================
   🔴 TEMPO REAL
========================= */
function escutarCooperativas() {
  db.collection("cooperativas").onSnapshot((snapshot) => {

    let html = "";

    snapshot.forEach((doc) => {
      const coop = doc.data();

      if (doc.id !== jogadorId) {
        html += `
          <div class="card">
            <b>${coop.nome}</b><br>
            ${coop.tipo}<br>
            💰 ${coop.dinheiro}
            <br>
            <button onclick="fundir('${doc.id}')">Fusão</button>
          </div>
        `;
      }
    });

    document.getElementById("lista").innerHTML = html;
  });
}

/* =========================
   🟢 ONLINE
========================= */
function escutarOnline() {
  db.collection("cooperativas").onSnapshot((snapshot) => {

    let html = "";

    snapshot.forEach((doc) => {
      const coop = doc.data();

      if (coop.online) {
        html += `<div>🟢 ${coop.nome}</div>`;
      }
    });

    document.getElementById("online").innerHTML = html;
  });
}

/* =========================
   🏆 RANKING
========================= */
function escutarRanking() {
  db.collection("cooperativas")
    .orderBy("dinheiro", "desc")
    .onSnapshot((snapshot) => {

      let html = "";
      let pos = 1;

      snapshot.forEach((doc) => {
        const coop = doc.data();
        html += `<div>#${pos} - ${coop.nome} 💰 ${coop.dinheiro}</div>`;
        pos++;
      });

      document.getElementById("ranking").innerHTML = html;
    });
}

/* =========================
   🤝 FUSÃO
========================= */
async function fundir(idOutro) {
  const novoNome = prompt("Nome da nova cooperativa:");
  if (!novoNome) return;

  dinheiro += 500;

  await db.collection("cooperativas").doc(jogadorId).update({
    nome: novoNome,
    dinheiro: dinheiro
  });

  atualizarTela();
}

/* =========================
   🔔 NOTIFICAÇÃO
========================= */
function notificarEntrada(nome) {
  const msg = `🚀 ${nome} entrou no jogo!`;

  db.collection("eventos").add({
    texto: msg,
    tempo: Date.now()
  });
}

/* =========================
   📢 EVENTOS
========================= */
function escutarEventos() {
  db.collection("eventos")
    .orderBy("tempo", "desc")
    .limit(5)
    .onSnapshot((snapshot) => {

      let html = "";

      snapshot.forEach((doc) => {
        html += `<div>${doc.data().texto}</div>`;
      });

      document.getElementById("eventos").innerHTML = html;
    });
}

/* =========================
   🎲 EVENTOS ALEATÓRIOS
========================= */
function iniciarEventos() {
  setInterval(async () => {

    const eventos = [
      { texto: "📉 Crise econômica!", valor: -200 },
      { texto: "📈 Boom de mercado!", valor: 300 },
      { texto: "💡 Inovação trouxe lucro!", valor: 200 }
    ];

    const evento = eventos[Math.floor(Math.random() * eventos.length)];

    dinheiro += evento.valor;

    await db.collection("cooperativas").doc(jogadorId).update({
      dinheiro: dinheiro
    });

    db.collection("eventos").add({
      texto: `${nomeJogador}: ${evento.texto}`,
      tempo: Date.now()
    });

    atualizarTela();

  }, 10000);
}

/* =========================
   🚨 FICAR OFFLINE AO SAIR
========================= */
window.addEventListener("beforeunload", async () => {
  if (jogadorId) {
    await db.collection("cooperativas").doc(jogadorId).update({
      online: false
    });
  }
});
