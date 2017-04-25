import * as vscode from 'vscode';
import {Pomodoro} from './pomodoro'
import {TimerType, Timer, TimeUnits} from './timer'

export class StatusBar {
  private static _instance: StatusBar;

  private static timerStatusBar: vscode.StatusBarItem;
  private static tasksCounterStatusBar: vscode.StatusBarItem;
  private static taskStatusBar: vscode.StatusBarItem;
  private static startStatusBar: vscode.StatusBarItem;

  private constructor() {
    StatusBar.timerStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 3);
    StatusBar.tasksCounterStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 2);
    StatusBar.taskStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
    StatusBar.startStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 4);

    StatusBar.timerStatusBar.text = `00:00`;
    StatusBar.taskStatusBar.text = `Stop`;
    StatusBar.tasksCounterStatusBar.text = `[0]`;
    StatusBar.startStatusBar.text = `$(triangle-right)`;
    StatusBar.startStatusBar.color = 'lightgreen';
    StatusBar.startStatusBar.tooltip = 'start';
    StatusBar.startStatusBar.command = 'todopomo.startOrStop';

    StatusBar.timerStatusBar.show();
    StatusBar.tasksCounterStatusBar.show();
    StatusBar.taskStatusBar.show();
    StatusBar.startStatusBar.show();

    setInterval(()=>{
        this.updateTasksCounter(Pomodoro.getInstance().todayTasksCounter);
    }, 30000);

  }

  public static getInstance(): StatusBar {
    if (StatusBar._instance === undefined ){
      StatusBar._instance = new StatusBar();
    }
    return StatusBar._instance;
  }

  public updateStartBar() {
    const pomodoro = Pomodoro.getInstance();
    if (pomodoro.timer && pomodoro.timer.type === TimerType.task) {
      StatusBar.startStatusBar.text = `$(primitive-square)`;
      StatusBar.startStatusBar.color = 'red';
      StatusBar.startStatusBar.tooltip = 'stop';
    }
    else {
      StatusBar.startStatusBar.text = `$(triangle-right)`;
      StatusBar.startStatusBar.color = 'lightgreen';
      StatusBar.startStatusBar.tooltip = 'start';
    }
  }

  public updateTimerBar(milliseconds: number) {
    StatusBar.timerStatusBar.text = `${this.convertMS(milliseconds)}`
  }

  public updateTasksCounter(todayTasks: number = 0) {
    StatusBar.tasksCounterStatusBar.text = `[${todayTasks}]`
  }

  public updateCurrentTask() {
    const pomodoro = Pomodoro.getInstance();
    if (pomodoro.timer && pomodoro.timer.type === TimerType.task){
      StatusBar.taskStatusBar.text = 'Work';
      StatusBar.taskStatusBar.tooltip = pomodoro.task.name.replace('☐', '\n☐');
    }else if (pomodoro.timer && pomodoro.timer.type === TimerType.break){
      StatusBar.taskStatusBar.text = 'Break';
    }else if (!pomodoro.timer){
      StatusBar.taskStatusBar.text = 'Stop';
    }
  }

  public convertMS(ms): string {

    function pad(number) {
      return ('00' + number).slice(-2);
    }
    var mins, secs;
    secs = Math.floor(ms / 1000);
    mins = Math.floor(secs / 60);
    secs = secs % 60;

    return  pad(mins) + ':' + pad(secs);
  };

  public dispose() {
    StatusBar.timerStatusBar.dispose();
    StatusBar.tasksCounterStatusBar.dispose();
    StatusBar.taskStatusBar.dispose();
  }
}

export async function YesNoPrompt(prompt: string): Promise<boolean> {
  const optionYes = {
    title: "Yes"
  } as vscode.MessageItem;
  const optionNo = {
    title: "No"
  } as vscode.MessageItem;

  const selection = await vscode.window.showInformationMessage(
    prompt,
    optionYes, optionNo
  );

  if (selection.title === `Yes`) {
    return Promise.resolve(true);
  }else {
    return Promise.resolve(false);
  }
}

export async function InputPrompt(_prompt: string, _placeHolder: string): Promise<string> {
  const response: string = await vscode.window
    .showInputBox({
      prompt: _prompt,
      placeHolder: _placeHolder,
    });

  return response;
}