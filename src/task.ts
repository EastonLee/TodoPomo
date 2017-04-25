import { TimeUnits, Timer } from './timer';
import { getConfig } from './config';
import {Pomodoro} from './pomodoro'

export class Task {
  public name: string;
  public startTime: string;
  public isCompleted: boolean;

  constructor(_name: string, _startTime: string, _isCompleted: boolean = false) {
    this.name = _name;
    this.startTime = _startTime;
    this.isCompleted = _isCompleted;
  }

  public updateTaskName(newName: string) {
    this.name = newName;
  }

  public startTask(next: Function, soundFile?: string, soundVolume?: number) : Timer {
    let duration = getConfig().task_duration;
    if (this.startTime !== null){ // if the task not already started
      let difference = new Date().getTime() - new Date(this.startTime).getTime();
      duration = getConfig().task_duration - difference;
    } else {
      this.startTime = new Date().toLocaleString();
    }

    let _timer = new Timer(duration, TimeUnits.Milliseconds);
    _timer.start(next, soundFile, soundVolume);
    
    return _timer;
  }
  
  public static getTodayTasksCounter(tasks: Task[]){
    return tasks.filter((t)=>{
		  return t.isCompleted && new Date(t.startTime).toLocaleDateString() === new Date().toLocaleDateString();
		}).length;
  }
}