export enum TaskType {
  /**
   * Tác vụ CPU
   */
  CPU,
  /**
   * Tác vụ  IO
   */
  IO
}

export enum IOType {
  /**
   * Chỉ có một thiết bị IO (IO chung)
   */
  Single,
  /**
   * Mỗi tiến trình có một thiết bị IO (IO riêng)
   */
  Multi
}

export class Task {
  /**
   * Kiểu của tác vụ
   */
  private type: TaskType;
  /**
   * Nhu cầu của tác vụ
   */
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

  /**
   * Thực hiện một đơn vị nhu cầu của tác vụ
   */
  public run(): void {
      this.duration--;
  }

  /**
   * Kiểm tra xem tác vụ đã hoàn thành chưa
   */
  public isFinished(): boolean {
      return this.duration === 0;
  }

}

export class Process {
  /**
   * Mã tiến trình duy nhất
   */
  private processID: string;
  /**
   * Hàng đợi các tác vụ. Trong tiến trình,  các tác vụ được lưu trữ lần lượt trong hàng đợi để chờ được thực thi.
   */
  private taskQueue: Queue<Task>;

  /**
   * Thời điểm tiến trình được đưa vào xử lý
   */
  private arrivalTime: number;

  /**
   * Cờ báo thực thi IO
   */
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

  /**
   * Kiểm tra xem tất cả các tiến trình có hoàn thành hết chưa
   * @param processList Danh sách các tiến trình cần kiểm tra
   */
  static isAllFinished(processList: Process[]): boolean {
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < processList.length; i++) {
          if (!processList[i].taskQueue.isEmpty()) {
              return false;
          }
      }
      return true;
  }

  /**
   * Lấy phần tử đầu tiên của hàng đợi dựa trên mã tiến trình
   * @param processList danh sách tiến trình cần tìm
   * @param queue hàng đợi tên của các tiến trình
   */
  static peekProcess(processList: Process[], queue: Queue<string>): Process | undefined {
      const name = queue.peek();
      if (name === undefined) {
          return undefined;
      } else {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < processList.length; i++) {
              if (processList[i].ProcessID === name) {
                  return processList[i];
              }
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
  /**
   * Thời điểm sự kiện được kích hoạt
   */
  private time: number;
  /**
   * Tên tiến trình gây ra sự kiện
   */
  private proccessName: string;
  /**
   * Mô tả chi tiết
   */
  private description: string;

  public endEvent: boolean;

  /**
   *
   * @param time Thời gian xảy ra sự kiện
   * @param processName Tiến trình gây nên sự kiện
   * @param description Thông tin mô tả
   */
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
  /**
   * Danh sách các sự kiện
   */
  private list: Array<StoryEvent>;

  /**
   * Bộ đếm thời gian các biến cố xảy ra
   */
  private clock: number;

  constructor() {
      this.list = new Array<StoryEvent>();
      this.clock = 0;
  }

  get Story(): Array<StoryEvent> {
      return this.list;
  }

  /**
   * Thêm sự kiện mới vào chuỗi các sự kiện
   * @param event Sự kiện mới
   */
  public addEvent(event: StoryEvent) {
      this.list.push(event);
  }

  /**
   * Thêm một sự kiện mới vào chuỗi sự kiện ngay tại thời điểm hiện tại
   * @param processName Tên tiến trình
   * @param description Mô tả
   */
  public putEvent(processName: string, description: string) {
      this.list.push(new StoryEvent(this.clock, processName, description));
  }

  /**
   * Tăng thời gian
   */
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
  /**
   * Nhét phần tử mới vào hàng đợi
   * @param element Phần tử cần nhét
   */
  public enQueue(element: T) {
      this.list.push(element);
  }
  /**
   * Lấy phần tử đầu ra khỏi hàng đợi
   */
  public deQueue(): T | undefined {
      return this.list.shift();
  }

  /**
   * Xem phần tử đầu tiên của hàng đợi nhưng không xóa khỏi hàng đợi
   */
  public peek(): T | undefined {
      if (this.list.length !== 0) {
          return this.list[0];
      }
      return undefined;

  }

  /**
   * Lấy độ dài hàng đợi
   */
  public getLength(): number {
      return this.list.length;
  }

  /**
   * Kiểm tra hàng đợi có rỗng hay không
   */
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
  /**
   * Điều phối tiến trình
   */
  scheduling(): Storyboard;
}

export abstract class Scheduler implements IScheduler {
  /**
   * Dãy các tiến trình cần điều phối
   */
  protected inputProcess: Array<Process>;
  /**
   * Kiểu của thiết bị nhập xuất (IO Device)
   */
  protected ioMode: IOType = IOType.Multi;

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

  get IOMode(): IOType {
      return this.ioMode;
  }
  set IOMode(ioMode: IOType) {
      this.ioMode = ioMode;
  }

  public scheduling(): Storyboard {
      const story = new Storyboard();
      this.cpuQueue = new Queue<string>();
      this.ioQueue = new Queue<string>();
      let cpuProcessing = false;
      let cpuRemaining = this.interruptTime;

      while (!Process.isAllFinished(this.inputProcess)) {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.inputProcess.length; i++) {
              if (this.inputProcess[i].ArrivalTime === story.Clock) {
                  this.cpuQueue.enQueue(this.inputProcess[i].ProcessID);
                  story.putEvent(this.inputProcess[i].ProcessID, 'Arrived');
              }
          }

          if (this.preempty) {
            this.minPreempting( this.inputProcess);
          }

          if (cpuRemaining === 0 && this.interruptTime !== 0) {
            this.cpuQueue.enQueue(this.cpuQueue.deQueue());
            cpuRemaining = this.interruptTime;
          }

          if (this.ioMode === IOType.Multi) {
              // tslint:disable-next-line:prefer-for-of
              for (let i = 0; i < this.inputProcess.length; i++) {
                  const proc = this.inputProcess[i];
                  if (proc.TaskQueue.getLength() !== 0 && proc.TaskQueue.peek().Type === TaskType.IO) {
                      if (!proc.TaskQueue.peek().isFinished()) {
                          story.addEvent(new StoryEvent(story.Clock + 1, proc.ProcessID, 'IO'));
                          proc.TaskQueue.peek().run();
                      }
                      if (proc.TaskQueue.peek().isFinished()) {
                          proc.TaskQueue.deQueue();
                          proc.IOFlag = false;
                          if (proc.TaskQueue.getLength() !== 0 && proc.TaskQueue.peek().Type === TaskType.CPU) {
                              this.cpuQueue.enQueue(proc.ProcessID);

                          }
                      }

                  }

              }
          }
          if (this.ioMode === IOType.Single) {
              if (this.ioQueue.getLength() !== 0) {
                  const proc = Process.peekProcess(this.inputProcess, this.ioQueue);
                  if (proc.TaskQueue.getLength() !== 0 && proc.TaskQueue.peek().Type === TaskType.IO) {
                      if (!proc.TaskQueue.peek().isFinished()) {
                          story.addEvent(new StoryEvent(story.Clock + 1, proc.ProcessID, 'IO'));
                          proc.TaskQueue.peek().run();
                      }
                      if (proc.TaskQueue.peek().isFinished()) {
                          proc.TaskQueue.deQueue();
                          this.ioQueue.deQueue();

                          if (proc.TaskQueue.getLength() !== 0 && proc.TaskQueue.peek().Type === TaskType.CPU) {

                              this.cpuQueue.enQueue(proc.ProcessID);
                              if (!cpuProcessing && this.sortable) {
                                  this.minPreempting(this.inputProcess);
                                  cpuProcessing = true;
                              }
                          }
                      }
                  }
              }
          }

          if (story.Clock === 0 && this.cpuQueue.getLength() > 1) {
              this.minPreempting(this.inputProcess);
          }

          if (this.cpuQueue.getLength() !== 0) {
              const proc = Process.peekProcess(this.inputProcess, this.cpuQueue);
              if (proc.TaskQueue.getLength() !== 0 && proc.TaskQueue.peek().Type === TaskType.CPU) {
                  if (!proc.TaskQueue.peek().isFinished()) {
                      if (this.interruptTime === 0) {
                          story.addEvent(new StoryEvent(story.Clock + 1, proc.ProcessID, 'CPU'));
                          proc.TaskQueue.peek().run();
                      } else {
                          if (cpuRemaining > 0) {
                              story.addEvent(new StoryEvent(story.Clock + 1, proc.ProcessID, 'CPU'));
                              proc.TaskQueue.peek().run();
                              cpuRemaining--;
                          }

                      }
                  }
                  // if (cpuRemaining === 0 && this.interruptTime !== 0) {
                  //     if (!proc.TaskQueue.peek().isFinished()) {
                  //         this.cpuQueue.enQueue(this.cpuQueue.deQueue());
                  //     }
                  //     cpuRemaining = this.interruptTime;
                  // }
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


              if (proc.TaskQueue.getLength() !== 0 && proc.TaskQueue.peek().Type === TaskType.IO) {

                  if (this.ioMode === IOType.Multi) {
                      proc.IOFlag = true;

                  } else {
                      this.ioQueue.enQueue(proc.ProcessID);
                  }
                  if (this.interruptTime > 0) {
                      cpuRemaining = this.interruptTime;
                  }
              } else if (proc.TaskQueue.getLength() === 0) {
                  story.addEvent(new StoryEvent(story.Clock + 1, proc.ProcessID, 'Terminated'));
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
  private sortQueue(startPos: number, queue: Queue<string>): void {
      const temp = new Array<Process>();

      if (queue.getLength() > startPos) {
          for (let i = startPos; i < queue.getLength(); i++) {
              const name = queue.List[i];
              // tslint:disable-next-line:prefer-for-of
              for (let j = 0; j < this.inputProcess.length; j++) {
                  if (this.inputProcess[j].ProcessID === name) {
                      temp.push(this.inputProcess[j]);
                  }
              }

          }

          temp.sort((a: Process, b: Process) => {
              const taskA = a.TaskQueue.peek();
              const taskB = b.TaskQueue.peek();
              if (taskA !== undefined && taskB !== undefined) {
                  if (taskA.Duration < taskB.Duration) {
                      return -1;
                  } else if (taskA.Duration > taskB.Duration) {
                      return 1;
 }
              }
              return 0;
          });

          let curr = 0;
          for (let i = startPos; i < queue.getLength(); i++) {
              queue.List[i] = temp[curr].ProcessID;
              curr++;
          }

      }

  }
  private minPreempting(list: Process[]): void {
      const temp = new Array<Process>();

      let minPos = 0;
      if (this.cpuQueue.getLength() > 0) {
          for (let i = 0; i < this.cpuQueue.getLength(); i++) {
              const name = this.cpuQueue.List[i];
              // tslint:disable-next-line:prefer-for-of
              for (let j = 0; j < this.inputProcess.length; j++) {
                  if (this.inputProcess[j].ProcessID === name) {
                      temp.push(this.inputProcess[j]);
                  }
              }


          }
          for (let i = 1; i < this.cpuQueue.getLength(); i++) {
              if (temp[i].TaskQueue.getLength() !== 0 && temp[0].TaskQueue.getLength() !== 0) {
                  if (temp[i].TaskQueue.peek().Duration < temp[0].TaskQueue.peek().Duration) {
                      minPos = i;
                      break;
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


export class FcfsScheduler extends Scheduler {


  /**
   *
   * @param inputProcess Dãy các tiến trình đầu vào
   */
  constructor(inputProcess: Array<Process>) {
      super(inputProcess);
      this.sortable = true;
      this.preempty = false;
      this.interruptTime = 0;
  }

  /**
   * Điều phối FCFS
   */
  public scheduling(): Storyboard {
      return super.scheduling();
  }
}


export class SjfScheduler extends Scheduler {

  /**
   *
   * @param inputProcess Dãy các tiến trình đầu vào
   */
  constructor(inputProcess: Array<Process>) {
      super(inputProcess);
      this.preempty = false;
      this.sortable = true;
      this.interruptTime = 0;
  }

  /**
   * Điều phối SJF
   */
  public scheduling(): Storyboard {
      return super.scheduling();
  }



}


export class SrtfScheduler extends Scheduler {

  /**
   *
   * @param inputProcess Dãy các tiến trình đầu vào
   */
  constructor(inputProcess: Array<Process>) {
      super(inputProcess);
      this.preempty = true;
      this.sortable = false;
      this.interruptTime = 0;
  }


  public scheduling(): Storyboard {
      return super.scheduling();
  }

}

export class RoundRobinScheduler extends Scheduler {

  /**
   * Lát thời gian (Slice of time)
   */
  private quantum = 1;


  /**
   *
   * @param inputProcess Dãy các tiến trình đầu vào
   * @param quantum lát thời gian
   */
  constructor(inputProcess: Array<Process>, quantum: number) {
      super(inputProcess);
      this.Quantum = quantum;
      this.interruptTime = quantum;
      this.sortable = false;
      this.preempty = false;
  }

  /**
   * Điều phối Round Robin
   */
  public scheduling(): Storyboard {
      return super.scheduling();
  }

  get Quantum(): number {
      return this.quantum;
  }
  set Quantum(quantum: number) {
      this.quantum = quantum;
      this.interruptTime = quantum;
  }

}
