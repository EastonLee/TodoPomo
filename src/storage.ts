import fs = require('fs');
import { Task } from './task';
import { Pomodoro } from './pomodoro';

export class TaskStorage {
  private filename: string;
  private _pomodoro: Pomodoro;

  constructor(_filename: string) {
    this.filename = _filename;
  }

  public save(tasks: Task[]): void {
    fs.writeFileSync(this.filename, JSON.stringify(tasks, null, "\t"));
  }

  public load(pomodoro: Pomodoro): void {
    let tasks: Task[] = [];
    this._pomodoro = pomodoro;
    if (this._pomodoro === undefined) {
      this._pomodoro = Pomodoro.getInstance();
    }

    if (!fs.existsSync(this.filename)) {
      fs.closeSync(fs.openSync(this.filename, 'w'));
      fs.writeFileSync(this.filename, '[]');
    }
    try {
      let items = JSON.parse(fs.readFileSync(this.filename).toString());
      tasks = items.map(t => {
        return new Task(t.name, t.startTime, t.isCompleted)
      });
      this._pomodoro.tasks = tasks;
    } catch (error) {
      console.log(error);
    }
  }

}