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

    let eventos = [];

    if (tipoJogador === "Transporte") {
      eventos = [
        { texto: "⛽ Alta no diesel impactou custos!", valor: -350 },
        { texto: "🚌 Licitação pública vencida!", valor: 600 },
        { texto: "🚧 Obras causaram atraso nas rotas!", valor: -200 },
        { texto: "📈 Aumento na demanda urbana!", valor: 350 },
        { texto: "🚨 Fiscalização gerou multa!", valor: -300 },
        { texto: "🔧 Renovação da frota com financiamento!", valor: -150 },
        { texto: "🎫 Integração com bilhete único aumentou receita!", valor: 400 }
      ];
    }

    else if (tipoJogador === "Saúde") {
      eventos = [
        { texto: "🦠 Surto aumentou atendimentos!", valor: 500 },
        { texto: "💊 Alta no preço de medicamentos!", valor: -350 },
        { texto: "🏥 Parceria com plano de saúde!", valor: 450 },
        { texto: "⚖️ Processo judicial inesperado!", valor: -500 },
        { texto: "👨‍⚕️ Contratação de especialistas!", valor: -200 },
        { texto: "📊 Aumento na confiança dos pacientes!", valor: 300 },
        { texto: "🧪 Investimento em tecnologia médica!", valor: -250 }
      ];
    }

    else if (tipoJogador === "Agropecuário") {
      eventos = [
        { texto: "🌧️ Excesso de chuva prejudicou safra!", valor: -400 },
        { texto: "🌞 Clima favorável aumentou produção!", valor: 500 },
        { texto: "🚜 Investimento em maquinário!", valor: -300 },
        { texto: "📦 Exportações cresceram!", valor: 600 },
        { texto: "🐛 Praga atingiu plantação!", valor: -350 },
        { texto: "💰 Valorização das commodities!", valor: 450 },
        { texto: "🚢 Problema logístico atrasou entregas!", valor: -250 }
      ];
    }

    else if (tipoJogador === "Financeira") {
      eventos = [
        { texto: "📉 Aumento da inadimplência!", valor: -500 },
        { texto: "📈 Taxa de juros favoreceu ganhos!", valor: 450 },
        { texto: "💳 Crescimento na base de clientes!", valor: 400 },
        { texto: "⚠️ Crise econômica nacional!", valor: -600 },
        { texto: "📊 Investimentos tiveram alta rentabilidade!", valor: 550 },
        { texto: "🏦 Nova regulamentação do Banco Central!", valor: -300 },
        { texto: "💰 Liberação de crédito incentivada!", valor: 350 }
      ];
    }

    else if (tipoJogador === "Consumo") {
      eventos = [
        { texto: "🛒 Alta demanda por produtos!", valor: 400 },
        { texto: "📦 Problema com fornecedor!", valor: -300 },
        { texto: "💸 Inflação elevou custos!", valor: -350 },
        { texto: "🎉 Campanha promocional de sucesso!", valor: 500 },
        { texto: "📉 Queda no consumo!", valor: -250 },
        { texto: "🤝 Parceria com novos fornecedores!", valor: 350 },
        { texto: "🚚 Atraso na logística!", valor: -200 }
      ];
    }

    else if (tipoJogador === "Infraestrutura") {
      eventos = [
        { texto: "⚡ Expansão da rede elétrica!", valor: 600 },
        { texto: "🌩️ Tempestade danificou estrutura!", valor: -500 },
        { texto: "📡 Melhoria tecnológica aumentou eficiência!", valor: 450 },
        { texto: "🔧 Manutenção emergencial!", valor: -300 },
        { texto: "📈 Aumento de usuários!", valor: 400 },
        { texto: "🏗️ Investimento em expansão!", valor: -350 },
        { texto: "⚖️ Nova regulação do governo!", valor: -250 }
      ];
    }

    else if (tipoJogador === "Trabalho e Serviços") {
      eventos = [
        { texto: "📈 Novo contrato empresarial!", valor: 500 },
        { texto: "❌ Perda de cliente importante!", valor: -400 },
        { texto: "👥 Aumento da demanda por serviços!", valor: 350 },
        { texto: "⚠️ Rotatividade de trabalhadores!", valor: -250 },
        { texto: "📊 Expansão do portfólio!", valor: 400 },
        { texto: "💼 Crise no setor afetou contratos!", valor: -350 },
        { texto: "🤝 Parceria estratégica!", valor: 450 }
      ];
    }

    // EVENTOS GLOBAIS (AFETAM TODOS)
    const eventosGlobais = [
      { texto: "🌎 Crise econômica global!", valor: -400 },
      { texto: "📈 Crescimento econômico nacional!", valor: 400 },
      { texto: "🏛️ Nova política pública de incentivo!", valor: 300 },
      { texto: "⚠️ Instabilidade política!", valor: -300 }
    ];

    // 20% de chance de evento global
    let evento;
    if (Math.random() < 0.2) {
      evento = eventosGlobais[Math.floor(Math.random() * eventosGlobais.length)];
    } else {
      evento = eventos[Math.floor(Math.random() * eventos.length)];
    }

    dinheiro += evento.valor;

    await db.collection("cooperativas").doc(jogadorId).update({
      dinheiro: dinheiro
    });

    db.collection("eventos").add({
      texto: `${nomeJogador} (${tipoJogador}): ${evento.texto}`,
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
