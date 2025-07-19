let executionTimeline = [];
let updateInterval = null;

function startSimulation() {
    if(runValidation() == false){
        alert("Invalid input");
        return;
    }
    let startButton = document.getElementById("startButton");
    startButton.disabled = true;
    isSimulationRunning = true;
    executionTimeline = [];
    let result;
    randomRows();
    let processList = getDatatables();
    if (inputChecker() == "FCFS")
        result = fcfs(processList);
    else if (inputChecker() == "SJF")
        result = sjf(processList);
    else if (inputChecker() == "SRTF")
        result = srtf(processList);
    else if (inputChecker() == "RR")
        result = rr(processList);
    else
        result = mlfq(processList);
    console.table(executionTimeline);
    //updateTableDelayed(result);
    startCpuTimer();
    updateTableLive(result);
    updateProgressBars(result);
    startLogsMonitor();
    startGanttLive();
}

function resetValues() {
    // Stop all intervals
    let startButton = document.getElementById("startButton");
    startButton.disabled = false;
    clearInterval(cpuTimerId);
    clearInterval(ganttIntervalId);
    clearInterval(logTimerId);

    // Also stop updateTableLive interval by tracking it!
    if (typeof updateInterval !== "undefined") {
        clearInterval(updateInterval);
    }

    // Reset global state
    cpuTime = 0;
    executionTimeline = [];
    printedLogs = new Set();

    // Reset CPU time display
    document.querySelector(".timenum").textContent = "CPU Time: -";

    // Reset monitoring panel values manually
    updateMonitoringPanel({
        cpuTime: '-',
        currentCPU: '-',
        nextCPU: '-',
        totalExecutionTime: '-',
        overallProgress: '-',
        avgTAT: '-',
        avgRT: '-'
    });

    // Clear table
    document.querySelector(".processTable tbody").innerHTML = "";

    // Clear logs and gantt
    document.querySelector(".logsGroup").innerHTML = "";
    document.querySelector(".ganttGroup").innerHTML = "";

    // Reset inputs
    document.querySelector(".numProcessInput").value = "";
    document.querySelector(".tsInput").value = "";
    document.querySelector(".allotmentInput").value = "";
}

let index = 0;
function updateMonitoringPanel({
    cpuTime = '-',
    currentCPU = '-',
    nextCPU = '-',
    totalExecutionTime = '-',
    overallProgress = '-',
    avgTAT = '-',
    avgRT = '-'
}) {
    const panel = document.querySelector(".monitoringPanel");
    if (!panel) return;

    const values = panel.querySelectorAll(".nextCPU");
    if (values.length < 6) return;

    values[0].textContent = `Current CPU: ${currentCPU}`;
    values[1].textContent = `Next CPU: ${nextCPU}`;
    
    console.log(`${index+1}`);
    values[2].textContent = `Total Execution Time: ${totalExecutionTime}`;
    values[3].textContent = `Overall Progress: ${overallProgress}`;
    values[4].textContent = `AVG TAT: ${avgTAT}`;
    values[5].textContent = `AVG RT: ${avgRT}`;
}

document.addEventListener("DOMContentLoaded", function () {
    let tsbox = document.querySelector(".tsInput");
    let allotbox = document.querySelector(".allotmentInput");
    tsbox.disabled = true;
    allotbox.disabled = true;
});

function inputChecker() {
    let value = document.querySelector(".algoDropdown").value;
    let tsbox = document.querySelector(".tsInput");
    let allotbox = document.querySelector(".allotmentInput");
    if (value == "RR") {
        tsbox.disabled = false;
        allotbox.disabled = true;
    } else if (value == "MLFQ") {
        tsbox.disabled = false;
        allotbox.disabled = false;
    } else {
        tsbox.disabled = true;
        allotbox.disabled = true;
    }
    return value;
}

function runValidation() {
    const numProbox = document.querySelector(".numProcessInput").value;
    const num = parseInt(numProbox);

    if (isNaN(num) || num < 1) {
        return false;
    }
    return true;
}



function randomRows(num) {
    let table = document.querySelector(".processTable tbody");
    table.innerHTML = "";
    processes = [];
    let numOfProcesses = 0;
    if (typeof num === 'number' && num > 0) {
        numOfProcesses = num;
    } else {
        const input = document.querySelector('.numProcessInput');
        if (input && !isNaN(parseInt(input.value))) {
            numOfProcesses = parseInt(input.value);
        }
    }

    for (let i = 0; i < numOfProcesses; i++) {
        const pid = `P${i + 1}`;
        let at = Math.floor(Math.random() * 16);
        let bt = Math.floor(Math.random() * 16) + 1;

        /*if (i == 0) {
            at = 0;
            bt = 10;
        } else if (i == 1) {
            at = 0;
            bt = 10;
        } else if (i == 2) {
            at = 0;
            bt = 10;
        }*/

        const process = { pid, at, bt, ct: 0, tat: 0, rt: 0 };
        processes.push(process);

        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${pid}</td>
      <td>${at}</td>
      <td>${bt}</td>
      <td class="ct">-</td>
      <td class="tat">-</td>
      <td class="rt">-</td>
      <td class="progress">
  <div style="width: 0%; height: 100%; background: lime; position: relative;">
    <span style="position: absolute; width: 100%; text-align: center; color: black; font-size: 0.8em;">0%</span>
  </div>
</td>

    `;
        table.appendChild(row);
    }

    return processes;
}

function fcfs(processList) {
    processList.sort((a, b) => a.at - b.at);
    let currentTime = 0;

    for (let p of processList) {
        if (currentTime < p.at) {
            executionTimeline.push({
                pid: "IDLE",
                starts: currentTime,
                duration: p.at - currentTime,
                endState: "idle"
            });
            currentTime = p.at;
        }


        const startTime = currentTime;
        const endTime = startTime + p.bt;

        p.rt = startTime - p.at;
        p.ct = endTime;
        p.tat = p.ct - p.at;
        currentTime = endTime;

        executionTimeline.push({
            pid: p.pid,
            starts: startTime,
            duration: p.bt,
            endState: "completed"
        });
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
        let available = processList.filter((p, i) => p.at <= time && !isVisited[i]);

        if (available.length === 0) {
            let nextArrival = Math.min(...processList.filter((_, i) => !isVisited[i]).map(p => p.at));
            if (nextArrival > time) {
                executionTimeline.push({
                    pid: "IDLE",
                    starts: time,
                    duration: nextArrival - time,
                    endState: "idle"
                });
            }
            time = nextArrival;
            continue;
        }


        available.sort((a, b) => a.bt - b.bt);
        const shortest = available[0];
        const idx = processList.findIndex(p => p.pid === shortest.pid);

        isVisited[idx] = true;
        completed++;

        const startTime = time;
        const endTime = time + shortest.bt;

        shortest.rt = startTime - shortest.at;
        if (shortest.rt < 0) shortest.rt = 0;

        shortest.ct = endTime;
        shortest.tat = shortest.ct - shortest.at;
        time = endTime;
        result.push(shortest);

        executionTimeline.push({
            pid: shortest.pid,
            starts: startTime,
            duration: shortest.bt,
            endState: "completed"
        });
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

    let currentPid = null;
    let sliceStart = null;

    while (completed < n) {
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
            const nextArrivals = processList.filter((_, i) => !isCompleted[i]).map(p => p.at);
            const nextArrival = Math.min(...nextArrivals.filter(a => a > time), Infinity);

            executionTimeline.push({
                pid: "IDLE",
                starts: time,
                duration: 1,
                endState: "idle"
            });

            time++;
            continue;
        }


        const p = processList[idx];

        if (!isStarted[idx]) {
            isStarted[idx] = true;
            startTimes[idx] = time;
        }

        if (currentPid !== p.pid) {
            if (currentPid !== null && sliceStart !== null) {
                executionTimeline.push({
                    pid: currentPid,
                    starts: sliceStart,
                    duration: time - sliceStart,
                    endState: "preempted"
                });
            }
            currentPid = p.pid;
            sliceStart = time;
        }

        remaining[idx]--;
        time++;
        
        if (remaining[idx] === 0) {
            isCompleted[idx] = true;
            completed++;
            p.ct = time;
            p.tat = p.ct - p.at;
            p.rt = startTimes[idx] - p.at;

            executionTimeline.push({
                pid: p.pid,
                starts: sliceStart,
                duration: time - sliceStart,
                endState: "completed"
            });

            currentPid = null;
            sliceStart = null;
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

    const originalOrder = processList.map(p => p.pid);
    const pidToIndex = processList.reduce((map, p, i) => {
        map[p.pid] = i;
        return map;
    }, {});

    const sorted = [...processList].sort((a, b) => a.at - b.at);
    for (let i = 0; i < n; i++) {
        if (sorted[i].at <= time && !isInQueue[pidToIndex[sorted[i].pid]]) {
            queue.push(pidToIndex[sorted[i].pid]);
            isInQueue[pidToIndex[sorted[i].pid]] = true;
        }
    }

    while (completed < n) {
        if (queue.length === 0) {
            let nextArrival = Math.min(
                ...processList.filter((_, i) => !isCompleted[i] && !isInQueue[i]).map(p => p.at),
                Infinity
            );

            if (nextArrival > time) {
                executionTimeline.push({
                    pid: "IDLE",
                    starts: time,
                    duration: nextArrival - time,
                    endState: "idle"
                });

                time = nextArrival;
            } else {
                time++;
            }

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

        executionTimeline.push({
            pid: p.pid,
            starts: time,
            duration: execTime,
            endState: (remaining[idx] === execTime) ? "completed" : "preempted"
        });

        remaining[idx] -= execTime;
        time += execTime;

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
            queue.push(idx);
        }
    }

    return originalOrder.map(pid => processList[pidToIndex[pid]]);
}

function mlfq(processList) {
    const baseQuantum = parseInt(document.querySelector(".tsInput").value);
    const allotment = parseInt(document.querySelector(".allotmentInput").value);
    const boostInterval = 20; // NEW: user-defined boost interval

    if (isNaN(baseQuantum) || isNaN(allotment) || isNaN(boostInterval)) {
        alert("Please enter valid quantum, allotment, and boost time.");
        return [];
    }

    const n = processList.length;
    let time = 0;
    let completed = 0;

    const remaining = processList.map(p => p.bt);
    const usedAllotment = new Array(n).fill(0);
    const rtSet = new Array(n).fill(false);
    const isCompleted = new Array(n).fill(false);
    const inQueue = new Array(n).fill(false);

    const Q0 = [], Q1 = [], Q2 = [], Q3 = [];

    while (completed < n) {
        // Handle new arrivals
        for (let i = 0; i < n; i++) {
            if (processList[i].at <= time && !isCompleted[i] && !inQueue[i]) {
                Q0.push(i);
                inQueue[i] = true;
            }
        }

        // Handle Boost
        if (time > 0 && time % boostInterval === 0) {
            // Reset all non-completed processes
            for (let i = 0; i < n; i++) {
                if (!isCompleted[i]) {
                    usedAllotment[i] = 0;
                    // Move to Q0 only if not already in Q0
                    if (!Q0.includes(i)) {
                        Q0.push(i);
                        inQueue[i] = true;
                    }
                }
            }
            // Clear other queues
            Q1.length = 0;
            Q2.length = 0;
            Q3.length = 0;
        }

        let idx = -1;
        let queueLevel = -1;
        let quantum = 0;

        if (Q0.length > 0) {
            idx = Q0.shift(); queueLevel = 0; quantum = baseQuantum;
        } else if (Q1.length > 0) {
            idx = Q1.shift(); queueLevel = 1; quantum = baseQuantum;
        } else if (Q2.length > 0) {
            idx = Q2.shift(); queueLevel = 2; quantum = baseQuantum;
        } else if (Q3.length > 0) {
            idx = Q3.shift(); queueLevel = 3; quantum = baseQuantum;
        } else {
            executionTimeline.push({
                pid: "IDLE",
                starts: time,
                duration: 1,
                endState: "idle"
            });
            time++;
            continue;
        }

        inQueue[idx] = false;
        const p = processList[idx];

        if (!rtSet[idx]) {
            p.rt = time - p.at;
            rtSet[idx] = true;
        }

        let execTime = 0;
        if (queueLevel < 3) {
            const remainingAllot = allotment - usedAllotment[idx];
            execTime = Math.min(quantum, remaining[idx], remainingAllot);
        } else {
            execTime = quantum;
        }

        const startTime = time;

        for (let t = 0; t < execTime; t++) {
            time++;

            // Check for new arrivals during execution
            for (let i = 0; i < n; i++) {
                if (processList[i].at === time && !isCompleted[i] && !inQueue[i]) {
                    Q0.push(i);
                    inQueue[i] = true;
                }
            }

            // Apply boost if boost time hits during execution
            if (time > 0 && time % boostInterval === 0) {
                for (let i = 0; i < n; i++) {
                    if (!isCompleted[i]) {
                        usedAllotment[i] = 0;
                        if (!Q0.includes(i)) {
                            Q0.push(i);
                            inQueue[i] = true;
                        }
                    }
                }
                Q1.length = 0;
                Q2.length = 0;
                Q3.length = 0;
            }
        }

        executionTimeline.push({
            pid: p.pid,
            starts: startTime,
            duration: execTime,
            endState: (remaining[idx] === execTime) ? "completed" : "preempted",
            queueLevel: queueLevel
        });

        remaining[idx] -= execTime;
        usedAllotment[idx] += execTime;

        if (remaining[idx] === 0) {
            isCompleted[idx] = true;
            p.ct = time;
            p.tat = p.ct - p.at;
            completed++;
        } else {
            if (queueLevel === 0 && usedAllotment[idx] >= allotment) {
                usedAllotment[idx] = 0; Q1.push(idx); inQueue[idx] = true;
            } else if (queueLevel === 1 && usedAllotment[idx] >= allotment) {
                usedAllotment[idx] = 0; Q2.push(idx); inQueue[idx] = true;
            } else if (queueLevel === 2 && usedAllotment[idx] >= allotment) {
                usedAllotment[idx] = 0; Q3.push(idx); inQueue[idx] = true;
            } else {
                if (queueLevel === 0) Q0.push(idx);
                else if (queueLevel === 1) Q1.push(idx);
                else if (queueLevel === 2) Q2.push(idx);
                else Q3.push(idx);
                inQueue[idx] = true;
            }
        }
    }

    return processList;
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
/*
function updateTableDelayed(processes) {
  const rows = document.querySelectorAll(".processTable tbody tr");

  processes.forEach((p) => {
    const row = Array.from(rows).find(r => r.children[0].textContent === p.pid);
    const ctCell = row.querySelector(".ct");
    const tatCell = row.querySelector(".tat");
    const rtCell = row.querySelector(".rt");

    ctCell.textContent = p.ct;
    tatCell.textContent = p.tat;
    rtCell.textContent = p.rt;
  });
}*/

let cpuTime = 0;
let cpuTimerId = null;

function startCpuTimer() {
    clearInterval(cpuTimerId);
    cpuTime = 0;
    updateCpuTimeDisplay();

    cpuTimerId = setInterval(() => {
        cpuTime += 0.1;
        updateCpuTimeDisplay();
    }, 100);
    
}

function updateCpuTimeDisplay() {
    document.querySelector(".timenum").textContent = `CPU Time: ${Math.floor(cpuTime)}`;
}

function updateTableLive(processes) {
    const completedMap = {};
    const rows = document.querySelectorAll(".processTable tbody tr");
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(() => {
        const currentCpu = Math.floor(cpuTime);


        let currentEntry = executionTimeline.find(e => currentCpu >= e.starts && currentCpu < e.starts + e.duration);
        let nextEntry = executionTimeline.find(e => e.starts > currentCpu);
        let currentCPU = currentEntry ? currentEntry.pid : '-';
        let nextCPU = nextEntry ? nextEntry.pid : '-';


        let totalExecutionTime = 0;
        if (executionTimeline.length > 0) {
            let last = executionTimeline[executionTimeline.length - 1];
            totalExecutionTime = last.starts + last.duration;
        }

        
        let finished = Object.keys(completedMap).length;
        let allDone = processes.length > 0 && finished === processes.length;
        let overallProgress = allDone ? '100%' : (processes.length > 0 ? `${Math.floor((finished / processes.length) * 100)}%` : '-');


        let tatSum = 0, rtSum = 0, tatCount = 0, rtCount = 0;
        processes.forEach(p => {
            if (typeof p.tat === 'number') { tatSum += p.tat; tatCount++; }
            if (typeof p.rt === 'number') { rtSum += p.rt; rtCount++; }
        });
        let avgTAT = tatCount > 0 ? (tatSum / tatCount).toFixed(2) : '-';
        let avgRT = rtCount > 0 ? (rtSum / rtCount).toFixed(2) : '-';

        updateMonitoringPanel({
            cpuTime: Math.floor(cpuTime),
            currentCPU,
            nextCPU,
            totalExecutionTime,
            overallProgress,
            avgTAT,
            avgRT
        });

        executionTimeline.forEach(entry => {
            const { pid, starts, duration, endState } = entry;
            const endTime = starts + duration;

            if (endState === "completed" && currentCpu >= endTime && !completedMap[pid]) {
                const process = processes.find(p => p.pid === pid);
                if (!process) return;

                const row = Array.from(rows).find(r => r.children[0].textContent.trim() === pid);
                if (!row) return;

                row.querySelector(".ct").textContent = process.ct;
                row.querySelector(".tat").textContent = process.tat;
                row.querySelector(".rt").textContent = process.rt;

                completedMap[pid] = true;
                row.classList.add("completed");
            }
        });

        if (allDone) {
            clearInterval(updateInterval); 
            clearInterval(cpuTimerId); 
            let startButton = document.getElementById("startButton");
            startButton.disabled = false;
        }

    }, 100);

}

function updateProgressBars(processes) {
    const rows = document.querySelectorAll(".processTable tbody tr");
    const progressTimeMap = {};
    let activePid = null;
    let lastCpu = -1;

    processes.forEach(p => {
        progressTimeMap[p.pid] = 0;
    });

    const interval = setInterval(() => {
        const currentCpu = Math.floor(cpuTime);

        if (currentCpu === lastCpu) return;
        lastCpu = currentCpu;

        
        const entry = executionTimeline.find(e =>
            currentCpu >= e.starts && currentCpu < e.starts + e.duration
        );

        if (entry) {
            activePid = entry.pid;
            progressTimeMap[entry.pid] += 1; 
        }

        processes.forEach(p => {
            const row = Array.from(rows).find(r => r.children[0].textContent.trim() === p.pid);
            const bar = row?.querySelector(".progress div");

            if (!bar) return;

            const executed = progressTimeMap[p.pid];
            const percent = Math.min((executed / p.bt) * 100, 100);

            bar.style.width = `${percent}%`;

            let label = bar.querySelector("span");
            if (!label) {
                label = document.createElement("span");
                label.style.position = "absolute";
                label.style.left = "50%";
                label.style.transform = "translateX(-50%)";
                label.style.color = "black";
                label.style.fontSize = "10px";
                label.style.pointerEvents = "none";
                bar.style.position = "relative";
                bar.appendChild(label);
            }

            label.textContent = `${Math.floor(percent)}%`;
        });


        const allDone = processes.every(p => {
            const row = Array.from(rows).find(r => r.children[0].textContent.trim() === p.pid);
            const bar = row?.querySelector(".progress div");
            const width = parseFloat(bar?.style.width || "0");
            return width >= 99.9;
        });
    }, 100);

}

let logTimerId = null;
let printedLogs = new Set();

function startLogsMonitor() {
    document.querySelector(".logsGroup").innerHTML = "";
    if (logTimerId !== null) clearInterval(logTimerId);
    printedLogs = new Set();

    const logPanel = document.querySelector(".logsGroup");
    const allotment = parseInt(document.querySelector(".allotmentInput").value) || 0;
    const currentAlgo = document.querySelector(".algoDropdown").value;

    const allotmentTracker = {};
    const queueLevelTracker = {}; 

    logTimerId = setInterval(() => {
        const currentCpu = Math.floor(cpuTime);

        executionTimeline.forEach((entry) => {
            const logId = `${entry.pid}-${entry.starts}-${entry.endState}`;

            if (currentCpu >= entry.starts && !printedLogs.has(logId)) {
                printedLogs.add(logId);

                if (entry.endState === "preempted" || entry.endState === "completed") {
                    appendLog(`[t=${entry.starts}] ${entry.pid} starts execution`);
                }

                const q = entry.duration;
                appendLog(`[t=${entry.starts}] ${entry.pid} runs for (${q})`);
            }

            if (currentCpu >= entry.starts + entry.duration && printedLogs.has(logId) && !printedLogs.has(logId + "-end")) {
                printedLogs.add(logId + "-end");

                if (entry.endState === "completed") {
                    appendLog(`[t=${entry.starts + entry.duration}] ${entry.pid} completed`);
                } else if (entry.endState === "preempted") {
                    if (currentAlgo === "MLFQ") {
                        
                        if (!(entry.pid in allotmentTracker)) allotmentTracker[entry.pid] = 0;
                        if (!(entry.pid in queueLevelTracker)) queueLevelTracker[entry.pid] = 0;

                        allotmentTracker[entry.pid] += entry.duration;

                        const used = allotmentTracker[entry.pid];
                        appendLog(`[t=${entry.starts + entry.duration}] ${entry.pid} preempted (allotment used: ${used}/${allotment})`);

                        if (used >= allotment && queueLevelTracker[entry.pid] < 3) {
                            queueLevelTracker[entry.pid]++;
                            allotmentTracker[entry.pid] = 0; 
                            appendLog(`[t=${entry.starts + entry.duration}] ${entry.pid} demoted to Q${queueLevelTracker[entry.pid]}`);
                        }
                    } else {
                       
                        appendLog(`[t=${entry.starts + entry.duration}] ${entry.pid} preempted`);
                    }
                }
            }
        });
    }, 100);

    function appendLog(text) {
        const div = document.createElement("div");
        div.textContent = text;
        document.querySelector(".logsGroup").appendChild(div);
        let logsGroup = document.querySelector(".logsGroup");
        logsGroup.scrollTop = logsGroup.scrollHeight;
    }
}

let ganttIntervalId = null;

function startGanttLive() {
    const ganttGroup = document.querySelector(".ganttGroup");
    ganttGroup.innerHTML = "";

    const scale = 30;
    const blockRefs = [];

    executionTimeline.forEach(entry => {
        const block = document.createElement("div");
        block.className = "ganttBlock";
        block.style.width = "0px";
        block.style.backgroundColor = entry.pid === "IDLE" ? "#888" : getColorForPid(entry.pid);
        block.style.whiteSpace = "pre-line"; 
        block.textContent = "";

        ganttGroup.appendChild(block);
        blockRefs.push({ element: block, entry });
    });

    if (ganttIntervalId !== null) clearInterval(ganttIntervalId);

    ganttIntervalId = setInterval(() => {
        const currentCpu = Math.floor(cpuTime);

        blockRefs.forEach(({ element, entry }) => {
            let label;
            if (entry.pid === "IDLE") {
                label = "IDLE";
            } else if (entry.queueLevel !== undefined) {
                label = `${entry.pid}\n(${entry.duration})\nQ${entry.queueLevel}`;
            } else {
                label = `${entry.pid}\n(${entry.duration})`;
            }


            if (currentCpu >= entry.starts && currentCpu < entry.starts + entry.duration) {
                const elapsed = currentCpu - entry.starts + 1;
                element.style.width = `${elapsed * scale}px`;
                element.textContent = label;
            } else if (currentCpu >= entry.starts + entry.duration) {
                element.style.width = `${entry.duration * scale}px`;
                element.textContent = label;
            }
        });

        ganttGroup.scrollLeft = ganttGroup.scrollWidth;

        const allDone = blockRefs.every(({ entry }) => currentCpu >= entry.starts + entry.duration);
        if (allDone) clearInterval(ganttIntervalId);
    }, 100);
}

const pidColorMap = {};

function getColorForPid(pid) {
    if (pidColorMap[pid]) return pidColorMap[pid];

    let newColor;
    const existingHues = Object.values(pidColorMap).map(color => {
        const hsl = color.match(/hsl\((\d+)/);
        return hsl ? parseInt(hsl[1]) : -1;
    });


    let tries = 0;
    do {
        const hue = Math.floor(Math.random() * 360);
        const tooClose = existingHues.some(h => Math.abs(h - hue) < 30);
        if (!tooClose || tries > 20) {
            newColor = `hsl(${hue}, 70%, 60%)`; 
            break;
        }
        tries++;
    } while (true);

    pidColorMap[pid] = newColor;
    return newColor;
}

