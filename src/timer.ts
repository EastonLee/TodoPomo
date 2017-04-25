const MINUTES_IN_HOUR: number = 60;
const SECONDS_IN_MINUTE: number = 60;
const MILLISECONDS_IN_SECOND : number = 1000;

import { StatusBar } from './ui';
import {Sound} from './sounds';

export enum TimeUnits {
  Milliseconds = 1,
  Second = MILLISECONDS_IN_SECOND,
  Minute = SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND,
  Hour = MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND
};

export enum TimerType{task, break, taskCounterRefresh};

export class Timer {
  public countdownMilliseconds: number;
  public type: TimerType;
  private isRunning: boolean;
  private _timer: NodeJS.Timer;


  constructor(countdown: number = 0, unit:TimeUnits) {
    this.countdownMilliseconds = countdown * unit;

  }

  public start (next: Function, soundFile?: string, soundVolume?: number) {
    const statusBars = StatusBar.getInstance();
    if (!this.isRunning){
      this.isRunning = true;
      this._timer = setInterval(()=> {
        this.tick();
        if (soundFile) Sound.play(soundFile, soundVolume);
        statusBars.updateTimerBar(this.countdownMilliseconds);
        if(this.countdownMilliseconds <= 0) {
          this.stop()
          next();
        }
      }, TimeUnits.Second);
    }
  }

  public stop() {
    if(this.isRunning) {
      this.isRunning = false;
      clearInterval(this._timer);
    }
  }

  public reset() {
    if(this.isRunning) {
      this.stop();
      this.countdownMilliseconds = 0;
    }
  }

  public tick() {    
    this.countdownMilliseconds -= TimeUnits.Second;
  }
}