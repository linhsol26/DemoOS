export enum TaskType {
  CPU,
  IO,
}

export class Task {
  private type: TaskType;
  private duration: number;

  constructor(type: TaskType, duration: number) {
    this.type = type;
    this.duration = duration;
  }

  get Type(): TaskType {
    return this.type;
  }

  get Duration(): number {
    return this.duration;
  }

  public run(): void {
    this.duration--;
  }

  public isFinished(): boolean {
    return this.duration === 0;
  }
}

export class Process {
  private processID: string;
  private taskQueue: Queue<Task>;
  private arrivalTime: number;

  private ioFlag: boolean;

  constructor(processID: string, arrivalTime: number, taskQueue: Queue<Task>) {
    this.processID = processID;
    this.taskQueue = taskQueue;
    this.arrivalTime = arrivalTime;
    this.ioFlag = false;
  }

  get TaskQueue(): Queue<Task> {
    return this.taskQueue;
  }

  set TaskQueue(queue: Queue<Task>) {
    this.taskQueue = queue;
  }

  get ProcessID(): string {
    return this.processID;
  }

  set ProcessID(id: string) {
    this.processID = id;
  }

  get ArrivalTime(): number {
    return this.arrivalTime;
  }

  static isAllFinished(processList: Process[]): boolean {
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < processList.length; i++) {
      if (!processList[i].taskQueue.isEmpty()) { return false; }
    }
    return true;
  }

  static peekProcess(
    processList: Process[],
    queue: Queue<string>
  ): Process | undefined {
    const name = queue.peek();
    if (name === undefined) {
      return undefined;
    } else {
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < processList.length; i++) {
        if (processList[i].ProcessID === name) { return processList[i]; }
      }
      return undefined;
    }
  }

  get IOFlag(): boolean {
    return this.ioFlag;
  }

  set IOFlag(flag: boolean) {
    this.ioFlag = flag;
  }

  public clone(): Process {
    return new Process(this.processID, this.arrivalTime, this.taskQueue);
  }
}

export class StoryEvent {
  private time: number;
  private proccessName: string;
  private description: string;
  public endEvent: boolean;

  constructor(time: number, processName: string, description: string) {
    this.time = time;
    this.proccessName = processName;
    this.description = description;
    this.endEvent = false;
  }

  get Time(): number {
    return this.time;
  }

  set Time(time: number) {
    this.time = time;
  }

  get ProcessName(): string {
    return this.proccessName;
  }
  set ProcessName(processName: string) {
    this.proccessName = processName;
  }

  get Description(): string {
    return this.description;
  }

  set Description(description: string) {
    this.description = description;
  }

  get EndEvent(): boolean {
    return this.endEvent;
  }

  set EndEvent(isEnd: boolean) {
    this.endEvent = isEnd;
  }

  public toString(): string {
    let result = this.time + ';' + this.proccessName + ';' + this.description;
    if (this.endEvent) {
      result += ' END';
    }
    return result;
  }
}

export class Storyboard {
  private list: Array<StoryEvent>;

  private clock: number;

  constructor() {
    this.list = new Array<StoryEvent>();
    this.clock = 0;
  }

  get Story(): Array<StoryEvent> {
    return this.list;
  }

  public addEvent(event: StoryEvent) {
    this.list.push(event);
  }

  public putEvent(processName: string, description: string) {
    this.list.push(new StoryEvent(this.clock, processName, description));
  }

  public tick(): void {
    this.clock++;
  }

  get Clock(): number {
    return this.clock;
  }
}

export class Queue<T> {
  private list: Array<T>;
  constructor() {
    this.list = new Array<T>();
  }

  public enQueue(element: T) {
    this.list.push(element);
  }

  public deQueue(): T | undefined {
    return this.list.shift();
  }

  public peek(): T | undefined {
    if (this.list.length !== 0) {
      return this.list[0];
    }
    return undefined;
  }

  public getLength(): number {
    return this.list.length;
  }

  public isEmpty(): boolean {
    return this.list.length === 0;
  }

  get List(): Array<T> {
    return this.list;
  }

  set List(list: Array<T>) {
    this.list = list;
  }
}

export interface IScheduler {
  scheduling(): Storyboard;
}

export abstract class Scheduler implements IScheduler {
  protected inputProcess: Array<Process>;

  protected preempty = false;
  protected interruptTime = 0;
  protected sortable = false;

  private cpuQueue: Queue<string> = new Queue<string>();
  private ioQueue: Queue<string> = new Queue<string>();

  constructor(inputProcess: Array<Process>) {
    this.inputProcess = inputProcess;
  }
  get InputProcess(): Array<Process> {
    return this.inputProcess;
  }
  set InputProcess(inputProcess: Array<Process>) {
    this.inputProcess = inputProcess;
  }

  public scheduling(): Storyboard {
    const story = new Storyboard();
    this.cpuQueue = new Queue<string>();
    this.ioQueue = new Queue<string>();
    let cpuProcessing = false;
    let cpuRemaining = this.interruptTime;

    while (!Process.isAllFinished(this.inputProcess)) {
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < this.inputProcess.length; i++) {
        if (this.inputProcess[i].ArrivalTime === story.Clock) {
          this.cpuQueue.enQueue(this.inputProcess[i].ProcessID);
          story.putEvent(this.inputProcess[i].ProcessID, 'Arrived');
        }
      }

      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < this.inputProcess.length; i++) {
        const proc = this.inputProcess[i];
        if (
          proc.TaskQueue.getLength() !== 0 &&
          proc.TaskQueue.peek().Type === TaskType.IO
        ) {
          if (!proc.TaskQueue.peek().isFinished()) {
            story.addEvent(
              new StoryEvent(story.Clock + 1, proc.ProcessID, 'IO')
            );
            proc.TaskQueue.peek().run();
          }
          if (proc.TaskQueue.peek().isFinished()) {
            proc.TaskQueue.deQueue();
            proc.IOFlag = false;
            if (
              proc.TaskQueue.getLength() !== 0 &&
              proc.TaskQueue.peek().Type === TaskType.CPU
            ) {
              this.cpuQueue.enQueue(proc.ProcessID);
            }
          }
        }
      }

      if (this.preempty) {
        this.minPreempting(this.inputProcess);
      }

      if (story.Clock === 0 && this.cpuQueue.getLength() > 1) {
        this.minPreempting(this.inputProcess);
      }

      if (this.cpuQueue.getLength() !== 0) {
        const proc = Process.peekProcess(this.inputProcess, this.cpuQueue);
        if (
          proc.TaskQueue.getLength() !== 0 &&
          proc.TaskQueue.peek().Type === TaskType.CPU
        ) {
          if (!proc.TaskQueue.peek().isFinished()) {
            if (this.interruptTime === 0) {
              story.addEvent(
                new StoryEvent(story.Clock + 1, proc.ProcessID, 'CPU')
              );
              proc.TaskQueue.peek().run();
            } else {
              if (cpuRemaining > 0) {
                story.addEvent(
                  new StoryEvent(story.Clock + 1, proc.ProcessID, 'CPU')
                );
                proc.TaskQueue.peek().run();
                cpuRemaining--;
              }
            }
          }
          if (cpuRemaining === 0 && this.interruptTime !== 0) {
            if (!proc.TaskQueue.peek().isFinished()) {
              this.cpuQueue.enQueue(this.cpuQueue.deQueue());
            }
            cpuRemaining = this.interruptTime;
          }
          if (proc.TaskQueue.peek().isFinished()) {
            this.cpuQueue.deQueue();
            proc.TaskQueue.deQueue();
            cpuProcessing = false;
            if (this.interruptTime > 0) {
              cpuRemaining = this.interruptTime;
            }
            if (this.sortable) {
              this.minPreempting(this.inputProcess);
            }
          }
        } else if (proc.TaskQueue.getLength() === 0) {
          if (this.sortable) {
            this.minPreempting(this.inputProcess);
          }
          cpuProcessing = false;
        }

        if (
          proc.TaskQueue.getLength() !== 0 &&
          proc.TaskQueue.peek().Type === TaskType.IO
        ) {
          proc.IOFlag = true;
          if (this.interruptTime > 0) {
            cpuRemaining = this.interruptTime;
          }
        } else if (proc.TaskQueue.getLength() === 0) {
          story.addEvent(
            new StoryEvent(story.Clock + 1, proc.ProcessID, 'Terminated')
          );
          cpuProcessing = false;
          if (this.sortable) {
            this.minPreempting(this.inputProcess);
          }
        }
      }

      story.tick();
    }

    return story;
  }

  private minPreempting(list: Process[]): void {
    const temp = new Array<Process>();

    let minPos = 0;
    if (this.cpuQueue.getLength() > 0) {
      for (let i = 0; i < this.cpuQueue.getLength(); i++) {
        const name = this.cpuQueue.List[i];
        // tslint:disable-next-line: prefer-for-of
        for (let j = 0; j < this.inputProcess.length; j++) {
          if (this.inputProcess[j].ProcessID === name) {
            temp.push(this.inputProcess[j]);
          }
        }
      }
      for (let i = 1; i < this.cpuQueue.getLength(); i++) {
        if (
          temp[i].TaskQueue.getLength() !== 0 &&
          temp[0].TaskQueue.getLength() !== 0
        ) {
          if (
            temp[i].TaskQueue.peek().Duration <
            temp[0].TaskQueue.peek().Duration
          ) {
            minPos = i;
          }
        }
      }
    }

    if (minPos > 0) {
      this.cpuQueue = new Queue<string>();
      for (let i = 1; i < temp.length; i++) {
        if (i === minPos) {
          this.cpuQueue.enQueue(temp[i].ProcessID);
          break;
        }
      }
      for (let i = 1; i < temp.length; i++) {
        if (i !== minPos) {
          this.cpuQueue.enQueue(temp[i].ProcessID);
        }
      }
      this.cpuQueue.enQueue(temp[0].ProcessID);
    }
  }
}

// algorithm

export class SrtfScheduler extends Scheduler {
  constructor(inputProcess: Array<Process>) {
    super(inputProcess);
    this.preempty = true;
    this.interruptTime = 0;
    this.sortable = false;
  }

  public scheduling(): Storyboard {
    return super.scheduling();
  }
}
