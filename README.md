07/01/25
|Bazar| - made the HTML layout and designed it with css.

07/05/25
|Bazar| - I added fcfs. and it worked!

07/07/25
[Allanic] Tried to implement Algorithm, having difficulties.

07/08/25
|Bazar| - after struggling to srtf because it needs preemption. finally I got the results.

07/09/25
[Allanic] Added SJF non preemptive

07/10/25
[Allanic] Added RR

07/10/25
|Bazar| - revised the whole code, made it organized. properly distributing the table data.

07/12/25
|Bazar| - added a MLFQ. now plans to make gantt chart

07/12/25
|Bazar| - added progress bars, timeline object, and soon will be working to dynamic elements.

07/12/25
|Bazar| - spent the rest of the day with responsiveLayouts.

07/14/25
[Allanic] Added CPU time that displayes data on lower left.


CPU Scheduler
Click on the drop down and select scheduling algorithm to run.
The visualizer with generate random 15 process if you didn't set it manually
otherwise it will limit the number of process by your input

FCFS
This will visualize the process by order of Arrival Time
The CPU picks the first process that arrives and executes it till completion
Once a process is finished, the CPU picks the next process in the queue
Continues until all processes are executed

<img width="1910" height="956" alt="image" src="https://github.com/user-attachments/assets/516169ab-3db3-40d7-9ba6-5ad25c27fb5d" />


SJF (non Preemptive)
Looks at all processes that have arrived by the current time.
Chooses the one with the shortest burst time.
Runs to completion.
Updates the CPU clock.
Repeats until all tasks are done.

<img width="1909" height="989" alt="image" src="https://github.com/user-attachments/assets/f254ef0c-535f-4a30-ab66-6caa66d21077" />


SRTF
Checks processes that are available and picks the best candidate to run
Among processes that have arrived and aren’t finished, pick the one with the smallest burst time.
If a new shorter process arrives, the current one is paused, and the CPU switches to the new one.
When a process’s remaining time reaches zero, it's marked as complete.

<img width="1918" height="1010" alt="image" src="https://github.com/user-attachments/assets/e6a4a7d9-0cc6-43b4-857e-7418bd6d2d6c" />


RR
Processes each task in time slices
Processes are placed in a FIFO queue
Picks the next process in queue
Runs it full quantum the remaining burst time 

<img width="1917" height="961" alt="image" src="https://github.com/user-attachments/assets/093eb508-596a-4c0b-bcf6-9ec8638abcf6" />


MLFQ
At every time unit, any process that arrives is placed into Q0 (highest priority).
The function always tries Q0 first, then Q1, Q2, and finally Q3.
Once it finds a queue with a process, it:
    Sets the quantum based on the queue level
    Chooses a process to run
If the process finishes:
  Marks it complete, logs response, turnaround, completion times
If the process did not finish:
  If it used its full allotment, it's demoted to the next queue.
  If it did not use its full allotment, it stays at the same level.
  It is then requeued.

  <img width="1915" height="960" alt="image" src="https://github.com/user-attachments/assets/0929ed86-cc1a-4592-9442-d8ca2cd436c1" />


  features:
  - when the simulation run, the inputs are disabled except for reset.
  - coloored gantt chart
  - next cpu and current cpu can be seen
  - validation all works in any input
  - detailed logging of processing
  - responsive layouts

  Known bugs and lackings po:
past bugs - Process generation did not work when adding a new processing algorithm
-resetValue not entirely resetting.
-when clicking simulation even the inputs are invalid time still starts.
-slider not properly giving the proper value.
-input disabling
-overlapping ganttcharts
-overlapping idlle gantt block


current lackings - 
No speedmultiplier
No manual input of processes
cannot be paused
no mlfq visualization just a gantt chart
fixed quantumTime in every levels.



