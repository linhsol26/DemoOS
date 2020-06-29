import { Injectable } from '@angular/core';
// tslint:disable-next-line:max-line-length
import { Process, Task, Queue, TaskType, SrtfScheduler, Storyboard, StoryEvent, FcfsScheduler, SjfScheduler, RoundRobinScheduler } from 'src/model/algorithm';

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

  runAlgo(procList: Array<Process>, phases: string[], io: Array<Array<number>>, arriveTime: Array<number>, chosen: string) {
    let scheduler;
    if (chosen === 'FCFS') {
      scheduler = new FcfsScheduler(procList);
    } else if (chosen === 'SJF') {
      scheduler = new SjfScheduler(procList);
    } else if (chosen === 'SRTF') {
      scheduler = new SrtfScheduler(procList);
    } else {
      scheduler = new RoundRobinScheduler(procList, 5);
    }

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
      if (result[i].Task !== ('Arrived' || 'Terminated')) {
        for (let j = result.length - 1; j > i; j--) {
          if (result[j] !== ('Arrived' || 'Terminated')) {
            if (
              result[i].startTime === result[j].startTime &&
              result[i].endTime === result[j].endTime &&
              result[i].Name === result[j].Name
            ) {
              if (result[i].Task === 'CPU') {
                if (result[j].Task === 'CPU') {
                    for (let k = j; k < result.length; k++) {
                        if (result[k].Task === 'CPU') {
                        result[k].startTime++;
                        result[k].endTime++;
                        }
                    }
                } else { // result[j].Task === 'IO'
                  result[j].startTime++;
                  result[j].endTime++;
                }
              } else if (result[i].Task === 'IO') {
                if (result[j].Task === 'IO') {
                    result[j].startTime++;
                    result[j].endTime++;
                } else { // result[j].Task === 'CPU'
                    result[j].startTime++;
                    result[j].endTime++;
                }
              }
            }

            if (
              result[i].startTime === result[j].startTime &&
              result[i].endTime === result[j].endTime &&
              result[i].Name !== result[j].Name
            ) {
              if (result[i].Task === 'CPU' && result[j].Task === 'CPU') {
                  result[j].startTime++;
                  result[j].endTime++;
              }
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

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < tempArray.length; i++) {
      for (let j = 0; j < tempArray[i].length; j++) {
        if (tempArray[i][j].startTime === tempArray[i][j].endTime) { continue; }
        const current = tempArray[i][j - 1];
        const next = tempArray[i][j];
        if (current.Task === 'IO' && next.Task === 'IO') {
          if (current.endTime !== next.startTime) {
              next.startTime = current.endTime;
              next.endTime = current.endTime + 1;
          }
        }
      }
    }

    const resultArray: Array<any> = [];
    for (let i = 0; i < phases.length; i++) {
      tempArray[i].pop();
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
              // this.waitingTime.push(next - current);
            }
          }
        }
      }
    }

    // // tslint:disable-next-line:prefer-for-of
    // for (let i = 0; i < phases.length; i++) {
    //   for (let j = 0; j < io.length; j++) {
    //     this.waitingTime[i] += io[i][j];
    //   }
    // }
    console.log([...new Set(resultArray)]);
    return [...new Set(resultArray)];
    }
  }

