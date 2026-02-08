const exprEl = document.getElementById("expr");
const resultEl = document.getElementById("result");
const btnClear = document.getElementById("btnClear");
const btnAC = document.getElementById("btnAC");

const chat = document.getElementById("chat");
const ask = document.getElementById("ask");
const btnAsk = document.getElementById("btnAsk");

let expression = "";
let lastResult = "0";

const SAFE = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  log: (x) => Math.log10(x),
  ln: (x) => Math.log(x),
  pow: Math.pow,
  pi: Math.PI,
  e: Math.E,
};

const UNITS = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
  g: 0.001,
  kg: 1,
  oz: 0.028349523125,
  lb: 0.45359237,
  ml: 0.001,
  l: 1,
};

function setExpression(val) {
  expression = val;
  exprEl.textContent = expression || "0";
}

function append(val) {
  if (expression === "0" && /\d/.test(val)) expression = "";
  expression += val;
  exprEl.textContent = expression;
  preview();
}

function del() {
  expression = expression.slice(0, -1);
  exprEl.textContent = expression || "0";
  preview();
}

function clearLine() {
  expression = "";
  exprEl.textContent = "0";
  preview();
}

function allClear() {
  expression = "";
  lastResult = "0";
  exprEl.textContent = "0";
  resultEl.textContent = "0";
}

function normalize(expr) {
  return expr.replace(/\^/g, "**").replace(/π/g, "pi");
}

function evaluate(expr) {
  const cleaned = normalize(expr);
  if (!/^[0-9+\-*/().,%\s^a-zA-Z]+$/.test(cleaned)) {
    throw new Error("Invalid characters");
  }
  const fn = Function(...Object.keys(SAFE), `"use strict"; return (${cleaned});`);
  return fn(...Object.values(SAFE));
}

function preview() {
  if (!expression) {
    resultEl.textContent = "0";
    return;
  }
  try {
    const val = evaluate(expression);
    if (Number.isFinite(val)) {
      resultEl.textContent = format(val);
      lastResult = format(val);
    }
  } catch {
    resultEl.textContent = "…";
  }
}

function equals() {
  if (!expression) return;
  try {
    const val = evaluate(expression);
    expression = format(val);
    exprEl.textContent = expression;
    resultEl.textContent = expression;
  } catch {
    resultEl.textContent = "Error";
  }
}

function format(val) {
  if (!Number.isFinite(val)) return "Error";
  const rounded = Math.round(val * 1e10) / 1e10;
  return String(rounded);
}

function addBubble(text, type) {
  const div = document.createElement("div");
  div.className = `bubble ${type}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function parseConversion(text) {
  const match = text.match(/convert\s+([0-9.]+)\s*(\w+)\s+(to|in)\s+(\w+)/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const from = match[2].toLowerCase();
  const to = match[4].toLowerCase();

  if (!(from in UNITS) || !(to in UNITS)) return null;

  const base = value * UNITS[from];
  const result = base / UNITS[to];
  return `${value} ${from} = ${format(result)} ${to}`;
}

function solveQuery(q) {
  const trimmed = q.trim();
  const conversion = parseConversion(trimmed);
  if (conversion) return conversion;

  try {
    const val = evaluate(trimmed);
    return `${trimmed} = ${format(val)}`;
  } catch {
    return "I can solve math expressions or convert units like: convert 12 cm to m.";
  }
}

function handleAsk() {
  const q = ask.value.trim();
  if (!q) return;
  addBubble(q, "user");
  const answer = solveQuery(q);
  addBubble(answer, "ai");
  ask.value = "";
}

// Calculator buttons
Array.from(document.querySelectorAll(".key")).forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.getAttribute("data-key");
    const action = btn.getAttribute("data-action");
    if (key) append(key);
    if (action === "del") del();
    if (action === "equals") equals();
  });
});

Array.from(document.querySelectorAll(".chip")).forEach((btn) => {
  btn.addEventListener("click", () => {
    const fn = btn.getAttribute("data-fn");
    if (fn === "pi") append("pi");
    else if (fn === "e") append("e");
    else append(fn);
  });
});

btnClear.addEventListener("click", clearLine);
btnAC.addEventListener("click", allClear);
btnAsk.addEventListener("click", handleAsk);
ask.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleAsk();
});

window.addEventListener("keydown", (e) => {
  const key = e.key;
  if (/[0-9+\-*/().%]/.test(key)) append(key);
  if (key === "Enter") equals();
  if (key === "Backspace") del();
  if (key === "Escape") clearLine();
});

setExpression("");
preview();
