let simulationInterval;
let simulationSpeed = 1;
let i = 0;
let simulationResult = [];

function startSimulation() {
  clearInterval(simulationInterval);  
  randomRows();
  const processes = getProcessesFromTable();
  simulationResult = fcfs(processes);
  updateTable(simulationResult); 
  renderGanttChart(simulationResult);

  i = 0;
  triggered = 0;

  const tick = 100; // 100ms = 0.1 time unit
  simulationInterval = setInterval(() => {
    triggered = 1;
    i += 0.2 * simulationSpeed; // ⬅️ Float increment
    i = parseFloat(i.toFixed(1)); // prevent floating point garbage like 0.30000000004
    timeHandler(i);
  }, tick);
}

let ganttBlocks = [];

function renderGanttChart(processes) {
  const ganttGroup = document.querySelector(".ganttGroup");
  ganttGroup.innerHTML = "";
  ganttBlocks = [];

  const totalTime = Math.max(...processes.map(p => p.ct));
  let prevEnd = 0;

  processes.forEach((p, index) => {
    // If there's a gap → insert idle block
    if (p.start > prevEnd) {
  const idleBlock = document.createElement("div");
  idleBlock.classList.add("ganttBlock");
  idleBlock.textContent = "IDLE";

  const idleStart = prevEnd;
  const idleBT = p.start - prevEnd;
  const idleLeft = (idleStart / totalTime) * 100;
  const idleWidth = (idleBT / totalTime) * 100;

  idleBlock.style.left = `${idleLeft}%`;
  idleBlock.style.width = `0%`; // animate later
  idleBlock.style.background = "#999";
  idleBlock.style.opacity = "0"; // will fade in

  ganttGroup.appendChild(idleBlock);

  // 🔥 Push IDLE like a process
  ganttBlocks.push({
    block: idleBlock,
    process: {
      pid: "IDLE",
      start: idleStart,
      bt: idleBT,
      ct: p.start
    },
    maxWidth: idleWidth
  });
}

    const block = document.createElement("div");
    block.classList.add("ganttBlock");
    block.textContent = p.pid;

    const left = (p.start / totalTime) * 100;
    const maxWidth = (p.bt / totalTime) * 100;

    block.style.left = `${left}%`;
    block.style.width = `0%`;
    block.style.background = getColor(index, p.pid);
    block.style.opacity = "0";

    ganttGroup.appendChild(block);
    ganttBlocks.push({ block, process: p, maxWidth });

    prevEnd = p.ct; // Track end of last block
  });
}

function getColor(index, pid) {
  if (pid === "IDLE") return "#999";
  const colors = ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#e91e63"];
  return colors[index % colors.length];
}

function timeHandler(i) {
  document.querySelector(".sliderText").textContent = `${simulationSpeed}`; // ✅ Show speed only

  simulationResult.forEach((p, index) => {
    const row = document.querySelectorAll(".processTable tbody tr")[index];
    const progressDiv = row.querySelector(".progress div");

    if (i >= p.start && i < p.ct) {
      let executedTime = i - p.start;
      let percentage = (executedTime / p.bt) * 100;
      progressDiv.style.width = `${percentage}%`;
      progressDiv.style.background = "#4caf50";
    } else if (i >= p.ct) {
      progressDiv.style.width = `100%`;
      progressDiv.style.background = "#4caf50";
    }
  });

  ganttBlocks.forEach(({ block, process, maxWidth }) => {
    if (i >= process.start && i < process.ct) {
      block.style.opacity = "1";
      const executed = i - process.start;
      const percent = (executed / process.bt) * maxWidth;
      block.style.width = `${percent}%`;
    } else if (i >= process.ct) {
      block.style.opacity = "1";
      block.style.width = `${maxWidth}%`;
    }
  });
}


function inputDisabler(algo){
  const tsInput = document.querySelector(".tsInput");
  const quantumInput = document.querySelector(".quantumInput");

  tsInput.disabled = true;
  quantumInput.disabled = true;

  if(algo == "RR")
    quantumInput.disabled = false;
  else if(algo == "MLFQ")
    tsInput.disabled = false;
}

function speedMultiplierChange(value){
  simulationSpeed = parseFloat(value); // 🔥 update global speed
  document.querySelector(".sliderText").textContent = `${value}`;
}


function randomRows() {
  let processes = [];
  let numOfProcesses = 10;
  let table = document.querySelector(".processTable tbody");
  table.innerHTML = "";

  for (let i = 0; i < numOfProcesses; i++) {
    let pid = `P${i + 1}`;
    let at = Math.floor(Math.random() * 10);
    let bt = Math.floor(Math.random() * 10) + 1;

    processes.push({ pid, at, bt });

    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${pid}</td>
      <td>${at}</td>
      <td>${bt}</td>
      <td class="ct">-</td>
      <td class="tat">-</td>
      <td class="rt">-</td>
      <td class="progress"><div style="width: 0%"></div></td>
    `;
    table.appendChild(row);
  }
}

function getProcessesFromTable() {
  const rows = document.querySelectorAll(".processTable tbody tr");
  let processes = [];

  rows.forEach((row) => {
    let cells = row.children;
    processes.push({
      pid: cells[0].textContent.trim(),
      at: parseInt(cells[1].textContent.trim()),
      bt: parseInt(cells[2].textContent.trim()),
      ct: 0,
      tat: 0,
      rt: 0
    });
  });

  return processes;
}

function fcfs(processes) {
  processes.sort((a, b) => a.at - b.at);
  let time = 0;

  for (let p of processes) {
    if (time < p.at) time = p.at;
    p.start = time;
    p.rt = time - p.at; 
    time += p.bt; 
    p.ct = time;
    p.tat = p.ct - p.at;
  }

  return processes;
}

function updateTable(processes) {
  const table = document.querySelector(".processTable tbody");
  table.innerHTML = "";

  processes.forEach((p) => {
    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.pid}</td>
      <td>${p.at}</td>
      <td>${p.bt}</td>
      <td class="ct">${p.ct}</td>
      <td class="tat">${p.tat}</td>
      <td class="rt">${p.rt}</td>
      <td class="progress"><div style="width: 0%"></div></td>
    `;
    table.appendChild(row);
  });
}



