import { Injectable } from '@angular/core';
import { Process, Task, Queue, TaskType, SrtfScheduler, Storyboard, StoryEvent } from 'src/model/algorithm';

@Injectable({
  providedIn: 'root'
})
export class AlgorithmService {

  waitingTime: Array<number> = [];
  responseTime: Array<number> = [];
  totalTime: Array<number> = [];

  constructor() { }

  initProcess(phases: Array<string>, arriveTime: Array<number>, cpu: Array<Array<number>>, io: Array<Array<number>>) {
    const procList = new Array<Process>();
    for (let i = 0; i < arriveTime.length; i++) {
      const tempTask = new Queue<Task>();
      for (let j = 0; j < cpu[i].length; j++) {
        tempTask.enQueue(new Task(TaskType.CPU, cpu[i][j]));
        if (io[i][j] !== undefined) {
            tempTask.enQueue(new Task(TaskType.IO, io[i][j]));
        }
      }
      procList.push(new Process(phases[i], arriveTime[i], tempTask));
    }
    return procList;
  }

  runAlgo(procList: Array<Process>, phases: string[], io: Array<Array<number>>, arriveTime: Array<number>) {
    const scheduler = new SrtfScheduler(procList);

    // Nhận kết quả trả về là một Storyboard
    const story: Storyboard = scheduler.scheduling();

    let result: Array<any> = [];

    story.Story.forEach((value: StoryEvent) => {
        result.push({
          startTime: value.Description === 'Arrived' ? value.Time : value.Time - 1,
          endTime: value.Time,
          Name: value.ProcessName,
          Task: value.Description,
        });
      });

    result = [... new Set(result)];
    for (let i = 0; i < result.length; i++) {
      if (result[i].startTime === result[i].endTime) {
        continue;
      }
      const previous = result[i - 1];
      const current = result[i];
      const next = result[i + 1];
      if (next !== undefined) {
        if ((current.startTime === next.startTime) &&
            (current.endTime === next.endTime) &&
            (current.Task === next.Task) &&
            (current.Name !== next.Name)) {
              if (current.Task === 'CPU') {
                next.startTime++;
                next.endTime++;
              }
        } else if ((current.startTime === previous.startTime) &&
            (current.endTime === previous.endTime) &&
            (current.Task === previous.Task) &&
            (current.Name !== previous.Name)) {
              if (current.Task === 'CPU') {
                next.startTime++;
                next.endTime++;
              }
        } else if ((previous.startTime === next.startTime) &&
            (previous.endTime === next.endTime) &&
            (previous.Task === next.Task) &&
            (previous.Name !== next.Name)) {
              if (current.Task === 'CPU') {
                next.startTime++;
                next.endTime++;
              }
        }
      }
    }
    // catch bug IO
    for (let i = 0; i < result.length; i++) {
      if (result[i].startTime === result[i].endTime) {
        continue;
      }
      const current = result[i - 1];
      const next = result[i];
      if (current.startTime === next.startTime) {
        if (current.Task === 'CPU') {
          next.startTime++;
          next.endTime++;
        }
      }
    }
    // catch bug CPU
    for (let i = 0; i < result.length; i++) {
      if (result[i].startTime === result[i].endTime) {
          continue;
      }
      const previous = result[i - 1];
      const next = result[i + 1];
      if (next !== undefined) {
        if ((previous.startTime === next.startTime) &&
            (previous.endTime === next.endTime) &&
            (previous.Name === next.Name) &&
            (previous.Task !== next.Task)) {
        for (let j = i; j < result.length; j++) {
            if (result[j].Task === 'CPU') {
            result[j].startTime++;
            result[j].endTime++;
            } else if (result[j].Task === 'IO') {
            result[j].startTime++;
            result[j].endTime++;
            }
          }
        }
      }
    }
    // filter each Process
    const eachProcess: Array<any> = [];
    for (const i of phases) {
      result.forEach(element => {
        if (element.Name === i) {
          eachProcess.push(element);
        }
      });
    }

    // slice each process
    let tempArray: Array<Array<any>> = [];
    for (const i of phases) {
        const temp = eachProcess.filter(element => {
            if (element.Name === i) {
                return element;
            }
        });
        tempArray.push(temp);
    }
    tempArray = [... new Set(tempArray)];

    for (let i = 0; i < phases.length; i++) {
      for (let j = 0; j < tempArray[i].length; j++) {
        if (tempArray[i][j].startTime === tempArray[i][j].endTime) {
            continue;
        }
        const current = tempArray[i][j - 1];
        const next = tempArray[i][j];
        const offSet = next.startTime - current.startTime;
        if (offSet === 0) {
          if (current.Task === 'IO' && next.Task === 'IO') {
              next.startTime -= 1;
              next.endTime -= 1;
          } else if (current.Task === 'CPU' && next.Task === 'IO') {
            next.startTime += 1;
            next.endTime += 1;
          } else if (current.Task === 'IO' && next.Task === 'CPU') {
            next.startTime++;
            next.endTime++;
          } else if (current.Task === 'CPU' && next.Task === 'CPU') {
            next.startTime++;
            next.endTime++;
          }
        } else if (offSet > 1) {
          if (current.Task === 'IO' && next.Task === 'IO') {
              next.startTime -= offSet - 1;
              next.endTime -= offSet - 1;
          }
        } else if (offSet < 0) {
          if (current.Task === 'IO' && next.Task === 'IO') {
            next.startTime++;
            next.endTime++;
            for (let k = tempArray[i].indexOf(next); k < tempArray[i].length - tempArray[i].indexOf(next); k++) {
              const check = tempArray[i][k + 1].startTime - tempArray[i][k].startTime;
              if (check === 1) {
                tempArray[i][k].startTime += check;
                tempArray[i][k].endTime += check;
              }
            }
          }
        }
      }
      // slice Terminated
      tempArray[i].pop();
    }
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < phases.length; i++) {
      // tslint:disable-next-line:prefer-for-of
      for (let j = 0; j < tempArray[i].length; j++) {
        if (tempArray[i][j].startTime === tempArray[i][j].endTime) {
          continue;
        }
        const previous = tempArray[i][j - 1];
        const current = tempArray[i][j];
        const next = tempArray[i][j + 1];
        if (next !== undefined) {
          if ((previous.startTime === next.startTime) &&
              (previous.endTime === next.endTime)) {
                next.startTime++;
                next.endTime++;
          } else if ((current.startTime === next.startTime) &&
              (current.endTime === next.endTime)) {
                next.startTime++;
                next.endTime++;
          } else if ((previous.startTime === current.startTime) &&
              (previous.endTime === current.endTime)) {
                next.startTime++;
                next.endTime++;
          }
          // check again :)
          if ((current.startTime === next.startTime) &&
              (current.endTime === next.endTime)) {
                next.startTime++;
                next.endTime++;
          }
        }
      }
    }

    const resultArray: Array<any> = [];
    for (let i = 0; i < phases.length; i++) {
      tempArray[i].forEach(element => {
        if (element.Task !== 'Terminated') {
          resultArray.push([
              element.Name,
              element.Task,
              element.startTime * 1000,
              element.endTime * 1000
          ]);
        }
      });
    }

    // push Terminated
    for (let i = 0; i < phases.length; i++) {
      if (tempArray[i][tempArray[i].length - 1].Task === 'CPU') {
        resultArray.push([
            tempArray[i][tempArray[i].length - 1].Name,
            'Terminated',
            tempArray[i][tempArray[i].length - 1].endTime * 1000,
            tempArray[i][tempArray[i].length - 1].endTime * 1000
        ]);
      }
      this.totalTime.push(tempArray[i][tempArray[i].length - 1].endTime - arriveTime[i]);
    }

    // push response
    for (let i = 0; i < phases.length; i++) {
      for (let j = 0; j < tempArray[i].length; j++) {
        if (tempArray[i][j].startTime === tempArray[i][j].endTime) {
            continue;
        } else {
          const current = tempArray[i][j - 1].endTime;
          const next = tempArray[i][j].startTime;
          if (current === next) {
              break;
          } else {
            resultArray.push([
                tempArray[i][j].Name,
                'Response',
                current * 1000,
                next * 1000
            ]);
            this.responseTime.push(next - current);
            break;
          }
        }
      }
    }

    // push waiting time
    for (let i = 0; i < phases.length; i++) {
      for (let j = 0; j < tempArray[i].length; j++) {
        if (tempArray[i][j].startTime === tempArray[i][j].endTime) {
            continue;
        } else {
          const current = tempArray[i][j - 1].endTime;
          const next = tempArray[i][j].startTime;
          if (current !== next) {
            if ((tempArray[i][j - 1].Task === 'CPU' && (tempArray[i][j].Task === 'CPU' || tempArray[i][j].Task === 'IO'))
            || (tempArray[i][j - 1].Task === 'IO' && (tempArray[i][j].Task === 'CPU' || tempArray[i][j].Task === 'CPU'))
            ) {
              resultArray.push([
                  tempArray[i][j].Name,
                  'Waiting',
                  current * 1000,
                  next * 1000
              ]);
              this.waitingTime.push(next - current);
            }
          }
        }
      }
    }

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < phases.length; i++) {
      for (let j = 0; j < io.length; j++) {
        this.waitingTime[i] += io[i][j];
      }
    }
    console.log([...new Set(resultArray)]);
    console.log(this.waitingTime);
    console.log(this.responseTime);
    console.log(this.totalTime);
    return [...new Set(resultArray)];
    }
  }

