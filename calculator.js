const display = document.querySelector("#display");
const keys = document.querySelector(".keys");
const operatorButtons = document.querySelectorAll("[data-operator]");

let currentValue = "0";
let storedValue = null;
let pendingOperator = null;
let shouldStartNewValue = false;
let hasError = false;

function render() {
  display.textContent = currentValue;
  operatorButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.operator === pendingOperator);
  });
}

function formatResult(value) {
  if (!Number.isFinite(value)) return null;
  // Avoid long floating-point tails while retaining useful precision.
  return String(Number(value.toPrecision(10)));
}

function calculate(left, right, operator) {
  switch (operator) {
    case "+": return left + right;
    case "−": return left - right;
    case "×": return left * right;
    case "÷": return right === 0 ? null : left / right;
    default: return right;
  }
}

function enterDigit(digit) {
  if (hasError) clear();
  if (shouldStartNewValue) {
    currentValue = digit;
    shouldStartNewValue = false;
  } else if (currentValue === "0") {
    currentValue = digit;
  } else if (currentValue.replace("-", "").length < 12) {
    currentValue += digit;
  }
  render();
}

function enterDecimal() {
  if (hasError) clear();
  if (shouldStartNewValue) {
    currentValue = "0.";
    shouldStartNewValue = false;
  } else if (!currentValue.includes(".")) {
    currentValue += ".";
  }
  render();
}

function chooseOperator(operator) {
  if (hasError) return;
  const value = Number(currentValue);
  if (pendingOperator && !shouldStartNewValue) {
    const result = calculate(storedValue, value, pendingOperator);
    const formatted = formatResult(result);
    if (formatted === null) return showError();
    currentValue = formatted;
  }
  storedValue = Number(currentValue);
  pendingOperator = operator;
  shouldStartNewValue = true;
  render();
}

function equals() {
  if (hasError || pendingOperator === null || shouldStartNewValue) return;
  const result = calculate(storedValue, Number(currentValue), pendingOperator);
  const formatted = formatResult(result);
  if (formatted === null) return showError();
  currentValue = formatted;
  storedValue = null;
  pendingOperator = null;
  shouldStartNewValue = true;
  render();
}

function clear() {
  currentValue = "0";
  storedValue = null;
  pendingOperator = null;
  shouldStartNewValue = false;
  hasError = false;
  render();
}

function showError() {
  currentValue = "Cannot divide by 0";
  storedValue = null;
  pendingOperator = null;
  shouldStartNewValue = true;
  hasError = true;
  render();
}

function handleAction(action) {
  if (action === "clear") return clear();
  if (action === "equals") return equals();
  if (hasError) return;

  if (action === "sign") {
    if (currentValue !== "0") currentValue = currentValue.startsWith("-") ? currentValue.slice(1) : `-${currentValue}`;
  } else if (action === "percent") {
    currentValue = formatResult(Number(currentValue) / 100) ?? "0";
  } else if (action === "decimal") {
    return enterDecimal();
  }
  shouldStartNewValue = false;
  render();
}

keys.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.digit !== undefined) enterDigit(button.dataset.digit);
  else if (button.dataset.operator) chooseOperator(button.dataset.operator);
  else if (button.dataset.action) handleAction(button.dataset.action);
});

document.addEventListener("keydown", (event) => {
  if (/^[0-9]$/.test(event.key)) return enterDigit(event.key);
  if (event.key === ".") return enterDecimal();
  if (["+", "-", "*", "/"].includes(event.key)) {
    event.preventDefault();
    const operators = { "+": "+", "-": "−", "*": "×", "/": "÷" };
    return chooseOperator(operators[event.key]);
  }
  if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    return equals();
  }
  if (event.key === "Escape") return clear();
  if (event.key === "Backspace" && !hasError) {
    if (shouldStartNewValue) shouldStartNewValue = false;
    currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : "0";
    if (currentValue === "-") currentValue = "0";
    render();
  }
});

render();
