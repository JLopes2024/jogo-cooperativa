import {
  db, collection, addDoc, getDocs,
  updateDoc, doc, getDoc
} from "./firebase.js";

let jogadorId = null;
let nomeJogador = "";
let tipoJogador = "";
let dinheiro = 0;

// Criar cooperativa
window.criarCooperativa = async function () {
  nomeJogador = document.getElementById("nome").value;
  tipoJogador = document.getElementById("tipo").value;
  dinheiro = 1000;

  const docRef = await addDoc(collection(db, "cooperativas"), {
    nome: nomeJogador,
    tipo: tipoJogador,
    dinheiro: dinheiro
  });

  jogadorId = docRef.id;

  document.getElementById("login").style.display = "none";
  document.getElementById("jogo").style.display = "block";

  atualizarTela();
  eventoAleatorio();
};

// Atualizar tela
function atualizarTela() {
  document.getElementById("titulo").innerText =
    `${nomeJogador} (${tipoJogador})`;

  document.getElementById("dinheiro").innerText =
    `💰 Dinheiro: R$ ${dinheiro}`;

  if (dinheiro >= 5000) {
    alert("🏆 Você venceu! Cooperativa de sucesso!");
  }
}

// Listar cooperativas
window.listarCooperativas = async function () {
  const querySnapshot = await getDocs(collection(db, "cooperativas"));

  let html = "";

  querySnapshot.forEach((docSnap) => {
    const coop = docSnap.data();

    if (docSnap.id !== jogadorId) {
      html += `
        <div>
          <b>${coop.nome}</b> (${coop.tipo})
          <button onclick="enviarPedido('${docSnap.id}')">
            Pedir Fusão
          </button>
        </div>
      `;
    }
  });

  document.getElementById("lista").innerHTML = html;
};

// Enviar pedido de fusão
window.enviarPedido = async function (idDestino) {
  await addDoc(collection(db, "pedidos"), {
    de: jogadorId,
    para: idDestino
  });

  alert("📩 Pedido enviado!");
};

// Ver pedidos recebidos
window.verPedidos = async function () {
  const querySnapshot = await getDocs(collection(db, "pedidos"));

  let html = "<h3>Pedidos recebidos</h3>";

  querySnapshot.forEach((docSnap) => {
    const pedido = docSnap.data();

    if (pedido.para === jogadorId) {
      html += `
        <div>
          Pedido de fusão
          <button onclick="responderPedido('${docSnap.id}', true)">Aceitar</button>
          <button onclick="responderPedido('${docSnap.id}', false)">Recusar</button>
        </div>
      `;
    }
  });

  document.getElementById("lista").innerHTML = html;
};

// Responder pedido
window.responderPedido = async function (pedidoId, aceito) {
  if (!aceito) {
    alert("❌ Fusão recusada");
    return;
  }

  const novoNome = prompt("Nome da nova cooperativa:");
  if (!novoNome) return;

  const bonus = calcularBonus(tipoJogador);

  dinheiro += bonus;

  const ref = doc(db, "cooperativas", jogadorId);

  await updateDoc(ref, {
    nome: novoNome,
    dinheiro: dinheiro
  });

  alert(`✅ Fusão realizada! +R$ ${bonus}`);

  atualizarTela();
};

// Lógica de bônus
function calcularBonus(tipo) {
  const mapa = {
    "Agropecuário": 800,
    "Transporte": 700,
    "Saúde": 600,
    "Financeira": 900,
    "Consumo": 500,
    "Infraestrutura": 750,
    "Trabalho e Serviços": 650
  };

  return mapa[tipo] || 300;
}

// Eventos aleatórios
function eventoAleatorio() {
  const eventos = [
    { msg: "📉 Crise econômica", valor: -200 },
    { msg: "📈 Incentivo do governo", valor: 300 },
    { msg: "🤝 Novo contrato", valor: 400 }
  ];

  const evento = eventos[Math.floor(Math.random() * eventos.length)];

  dinheiro += evento.valor;
  alert(`${evento.msg} (${evento.valor})`);

  atualizarTela();
}
