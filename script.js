
function startSimulation() {
  let result;
  randomRows();
  let processList = getDatatables();
  if(inputChecker() == "FCFS")
    result = fcfs(processList);
  else if(inputChecker() == "SJF")
    result = sjf(processList);
  else if(inputChecker() == "SRTF")
    result = srtf(processList);
  else if(inputChecker() == "RR")
    result = rr(processList);
  else
    alert("Posang bato wala pang ganto na algo");
  updateTable(result);
}

function inputChecker(){
  let value = document.querySelector(".algoDropdown").value;
  let tsbox = document.querySelector(".tsInput");
  let allotbox = document.querySelector(".quantumInput");
  if(value == "RR"){
    tsbox.disabled = false;
    allotbox.disabled = true;
  }
  else if(value == "MLFQ"){
    tsbox.disabled = false;
    allotbox.disabled = false;
  }
  else{
    tsbox.disabled = true;
    allotbox.disabled = true;
  }
  return value;
}

function randomRows() {
  let table = document.querySelector(".processTable tbody");
  table.innerHTML = "";
  processes = [];

  const numOfProcesses = 3;

  for (let i = 0; i < numOfProcesses; i++) {
    const pid = `P${i + 1}`;
    let at = Math.floor(Math.random() * 4);
    let bt = Math.floor(Math.random() * 4) + 1;


    if(i==0){
      at =1; bt =1;
    }else if (i==1){
      at =0; bt=4;
    }else if(i==2){
      at=1; bt=3;
    }

    const process = {
      pid,
      at,
      bt,
      ct: 0,
      tat: 0,
      rt: 0,

    }

    processes.push(process);

    const row = document.createElement("tr");
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

  return processes;
}

function fcfs(processList) {
  // Sort by arrival time
  processList.sort((a, b) => a.at - b.at);

  let currentTime = 0;

  for (let p of processList) {
    if (currentTime < p.at) currentTime = p.at; // If CPU is idle
    p.rt = currentTime - p.at;                 // RT = Start - Arrival
    p.ct = currentTime + p.bt;                 // CT = Start + Burst
    p.tat = p.ct - p.at;                       // TAT = CT - Arrival
    currentTime = p.ct;                        // Move clock forward
  }

  return processList;
}

function sjf(processList) {
  let n = processList.length;
  let time = 0;
  let completed = 0;
  let isVisited = new Array(n).fill(false);
  let result = [];

  while (completed < n) {
    // Filter processes that have arrived and are not yet done
    let available = processList.filter((p, i) => p.at <= time && !isVisited[i]);

    if (available.length === 0) {
      time++; // No process has arrived yet, advance time
      continue;
    }

    // Pick process with shortest burst time
    available.sort((a, b) => a.bt - b.bt);
    const shortest = available[0];

    const idx = processList.findIndex(p => p.pid === shortest.pid);
    isVisited[idx] = true;
    completed++;

    // Start time = current time
    shortest.rt = time - shortest.at;
    if (shortest.rt < 0) shortest.rt = 0; // if process starts at arrival

    shortest.ct = time + shortest.bt;
    shortest.tat = shortest.ct - shortest.at;
    
    time = shortest.ct;

    result.push(shortest);
  }

  return result;
}

function srtf(processList) {
  const n = processList.length;
  let time = 0;
  let completed = 0;
  const remaining = processList.map(p => p.bt);
  const isCompleted = new Array(n).fill(false);
  const isStarted = new Array(n).fill(false);
  const startTimes = new Array(n).fill(null);

  while (completed < n) {
    // Find the available process with the shortest remaining time
    let idx = -1;
    let minRT = Infinity;

    for (let i = 0; i < n; i++) {
      const p = processList[i];
      if (p.at <= time && !isCompleted[i] && remaining[i] < minRT && remaining[i] > 0) {
        minRT = remaining[i];
        idx = i;
      }
    }

    if (idx === -1) {
      time++; // CPU is idle
      continue;
    }

    if (!isStarted[idx]) {
      isStarted[idx] = true;
      startTimes[idx] = time;
    }

    remaining[idx]--;
    time++;

    // If finished
    if (remaining[idx] === 0) {
      isCompleted[idx] = true;
      completed++;

      const p = processList[idx];
      p.ct = time;
      p.tat = p.ct - p.at;
      p.rt = startTimes[idx] - p.at;
    }
  }

  return processList;
}

function rr(processList) {
  const quantumInput = document.querySelector(".tsInput").value;
  if (!quantumInput || isNaN(parseInt(quantumInput))) {
    alert("Please enter a valid quantum time.");
    return [];
  }

  const quantum = parseInt(quantumInput);
  const n = processList.length;

  let time = 0;
  let completed = 0;
  const remaining = processList.map(p => p.bt);
  const isInQueue = new Array(n).fill(false);
  const isCompleted = new Array(n).fill(false);
  const rtSet = new Array(n).fill(false);
  const queue = [];

  const originalOrder = processList.map(p => p.pid); // Preserve PID order
  const pidToIndex = processList.reduce((map, p, i) => {
    map[p.pid] = i;
    return map;
  }, {});

  // Sort processes by arrival time to get first entries
  const sorted = [...processList].sort((a, b) => a.at - b.at);
  for (let i = 0; i < n; i++) {
    if (sorted[i].at <= time && !isInQueue[pidToIndex[sorted[i].pid]]) {
      queue.push(pidToIndex[sorted[i].pid]);
      isInQueue[pidToIndex[sorted[i].pid]] = true;
    }
  }

  while (completed < n) {
    if (queue.length === 0) {
      time++;
      for (let i = 0; i < n; i++) {
        if (!isCompleted[i] && !isInQueue[i] && processList[i].at <= time) {
          queue.push(i);
          isInQueue[i] = true;
        }
      }
      continue;
    }

    const idx = queue.shift();
    const p = processList[idx];

    if (!rtSet[idx]) {
      p.rt = time - p.at;
      rtSet[idx] = true;
    }

    const execTime = Math.min(quantum, remaining[idx]);
    remaining[idx] -= execTime;
    time += execTime;

    // Check for new arrivals during execution window
    for (let i = 0; i < n; i++) {
      if (!isCompleted[i] && !isInQueue[i] && processList[i].at <= time) {
        queue.push(i);
        isInQueue[i] = true;
      }
    }

    if (remaining[idx] === 0) {
      p.ct = time;
      p.tat = p.ct - p.at;
      isCompleted[idx] = true;
      completed++;
    } else {
      queue.push(idx); // Not yet done, requeue
    }
  }

  // Return in original table row order (P1, P2, etc.)
  return originalOrder.map(pid => processList[pidToIndex[pid]]);
}

function getDatatables() {
  const rows = document.querySelectorAll(".processTable tbody tr");
  const data = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    const process = {
      pid: cells[0].textContent.trim(),
      at: parseInt(cells[1].textContent.trim()),
      bt: parseInt(cells[2].textContent.trim()),
      ct: cells[3].textContent.trim() === "-" ? null : parseInt(cells[3].textContent.trim()),
      tat: cells[4].textContent.trim() === "-" ? null : parseInt(cells[4].textContent.trim()),
      rt: cells[5].textContent.trim() === "-" ? null : parseInt(cells[5].textContent.trim())
    };
    data.push(process);
  });

  return data;
}


function mlfq(){

}

function updateTable(updatedProcesses) {
  const rows = document.querySelectorAll(".processTable tbody tr");

  updatedProcesses.forEach((process) => {
    for (let row of rows) {
      const rowPid = row.children[0].textContent;
      if (rowPid === process.pid) {
        row.querySelector(".ct").textContent = process.ct;
        row.querySelector(".tat").textContent = process.tat;
        row.querySelector(".rt").textContent = process.rt;
        break; // Found match, exit loop
      }
    }
  });
}



