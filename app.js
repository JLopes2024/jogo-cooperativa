import { db, collection, addDoc, getDocs, updateDoc, doc } from "./firebase.js";

let jogadorId = null;
let nomeJogador = "";
let tipoJogador = "";
let dinheiro = 0;

// Criar cooperativa
window.criarCooperativa = async function () {
  nomeJogador = document.getElementById("nome").value;
  tipoJogador = document.getElementById("tipo").value;

  dinheiro = 1000; // inicial

  const docRef = await addDoc(collection(db, "cooperativas"), {
    nome: nomeJogador,
    tipo: tipoJogador,
    dinheiro: dinheiro
  });

  jogadorId = docRef.id;

  document.getElementById("login").style.display = "none";
  document.getElementById("jogo").style.display = "block";

  atualizarTela();
};

// Atualizar tela
function atualizarTela() {
  document.getElementById("titulo").innerText =
    nomeJogador + " (" + tipoJogador + ")";
  document.getElementById("dinheiro").innerText =
    "💰 Dinheiro: R$ " + dinheiro;
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
          <button onclick="fundir('${docSnap.id}')">Fusão</button>
        </div>
      `;
    }
  });

  document.getElementById("lista").innerHTML = html;
};

// Função de fusão
window.fundir = async function (idOutro) {
  const novoNome = prompt("Nome da nova cooperativa:");

  if (!novoNome) return;

  // bônus secreto 💰
  dinheiro += 500;

  const ref = doc(db, "cooperativas", jogadorId);

  await updateDoc(ref, {
    nome: novoNome,
    dinheiro: dinheiro
  });

  alert("Fusão realizada! Você ganhou bônus secreto!");

  atualizarTela();
};