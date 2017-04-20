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

  public startTask(next: Function) : Timer {
    let duration = getConfig().task_duration;
    if (this.startTime !== null){ // if the task not already started
      let difference = new Date().getTime() - new Date(this.startTime).getTime();
      duration = getConfig().task_duration - difference;
    } else {
      this.startTime = new Date().toLocaleString();
    }

    let _timer = new Timer(duration, TimeUnits.Milliseconds);
    _timer.start(next);
    
    return _timer;
  }
  public static getTodayTasksCounter(){
    const pomodoro = Pomodoro.getInstance();
    return pomodoro.tasks.filter((t)=>{
		  return t.isCompleted && new Date(t.startTime).toLocaleDateString() === new Date().toLocaleDateString();
		}).length;
  }
}