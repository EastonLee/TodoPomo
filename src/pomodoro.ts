import * as vscode from 'vscode';
import { Task } from './task';
import { TimeUnits, Timer, TimerType } from './timer';
import { getConfig } from './config';
import { YesNoPrompt, InputPrompt, StatusBar } from './ui';
import { TaskStorage } from './storage';
import {TextDocument, TextLine, Position, CompletionItem, Range} from 'vscode';
import {TextEditor, TextEditorEdit} from 'vscode';
import {TodoDocument} from './TodoDocument'

// State transition
// Break <=> Task running <=> No task
// Break timer, Task timer, no timer

export class Pomodoro {
	private static _instance: Pomodoro;

	private _statusBars: StatusBar = StatusBar.getInstance();

	private _storage: TaskStorage;

	public textEditor: TextEditor;
	public edit: TextEditorEdit;
	public todayTasksCounter: number = 0;
	public tasks: Task[];
	public task: Task;
	public completedTasksCounter: number;
	public currentTaskIndex: number;

	private breakCounter: number;

	public timer: Timer;

	private constructor() {
		this.tasks = [] as Task[];
		this.completedTasksCounter = 0;
		this.breakCounter = 0;
		this._storage = new TaskStorage(getConfig().tasks_file);
	}

	public static getInstance(): Pomodoro {	
		// easton: only todopomo.start command need textEditor	
		if (Pomodoro._instance === null || Pomodoro._instance === undefined) {
			Pomodoro._instance =  new Pomodoro();
		}
		return Pomodoro._instance;
	}

	public preload() {
		const pomodoro = Pomodoro.getInstance();
		pomodoro._storage.load();

		for (let taskIndex in pomodoro.tasks) {			
			if (pomodoro.tasks[taskIndex].startTime === null) {				
				break;
			}
			else {				
				if (pomodoro.tasks[taskIndex].isCompleted) {
					pomodoro.completedTasksCounter ++;
				} 
				// else {
				// 	pomodoro.currentTaskIndex = parseInt(taskIndex);
				// }
			}
		}
		this.todayTasksCounter = Task.getTodayTasksCounter();
		
	}

	public async addTask() {
		const pomodoro = Pomodoro.getInstance();
		const newTask: string = await InputPrompt(`Add a new task to the Pomodoro`, `task name`);

		pomodoro.tasks.push(new Task(newTask, null));
		pomodoro._storage.save();

		pomodoro._statusBars.updateTasksCounter(pomodoro.todayTasksCounter)
	}

	public openTodoFile(): TextEditor{
		let textEditor: TextEditor = vscode.window.activeTextEditor;
		if (!TodoDocument.isSupportedLanguage(textEditor)){
			let openPath = vscode.Uri.file(getConfig()['todo_file']);
			vscode.workspace.openTextDocument(openPath).then(doc => {
				vscode.window.showTextDocument(doc);
			});
			return
		}
		return textEditor;
	}
	// public start(textEditor: TextEditor, edit: TextEditorEdit) {
	public start() {
		const pomodoro = Pomodoro.getInstance();
		let textEditor = pomodoro.openTodoFile();
		if (!textEditor) return

		pomodoro.textEditor = textEditor;
		if (pomodoro.timer && pomodoro.timer.type === TimerType.task){
			console.log('There is task running, stop previous one first.')
			return
		}
		let task = new TodoDocument(pomodoro.textEditor.document).getTaskPlusProjects(pomodoro.textEditor.selection.start);
		if (task){
			pomodoro.task = new Task(task.getTask(), null);
			pomodoro.tasks.push(pomodoro.task);
			if (pomodoro.timer){
				pomodoro.stop();
			}
			pomodoro.timer = pomodoro.task.startTask(pomodoro.takeBreak);
			pomodoro.timer.type = TimerType.task;
			pomodoro._statusBars.updateStartBar();
			// pomodoro._statusBars.updateTimerBar(task.getTask());
			pomodoro._statusBars.updateCurrentTask();
			pomodoro._storage.save();
		}
	}

	public stop() {
		const pomodoro = Pomodoro.getInstance();
		pomodoro.timer.reset();
		pomodoro.timer = null;
		pomodoro._statusBars.updateStartBar();
		pomodoro._statusBars.updateTimerBar(0);
		pomodoro._statusBars.updateCurrentTask();
	}

	public toggle() {
		const pomodoro = Pomodoro.getInstance();
		if (pomodoro.timer && pomodoro.timer.type === TimerType.task) pomodoro.stop();
		else pomodoro.start();
	}

	public report() {
		const pomodoro = Pomodoro.getInstance();
		// pomodoro.pickTask();
		if (pomodoro.currentTaskIndex < pomodoro.tasks.length) {
			pomodoro._statusBars.updateCurrentTask()
		
			// pomodoro._timer = pomodoro.tasks[pomodoro.currentTaskIndex].startTask(pomodoro.askAboutTaskCompletion);
			pomodoro._storage.save();	
		} else {
			return;
		}
	}
	public CompleteLastTask(){
		let pomodoro = Pomodoro.getInstance();
		let lastTask = pomodoro.tasks[pomodoro.tasks.length-1];
		lastTask.isCompleted = true;
		pomodoro._storage.save();
		pomodoro.task = null;
		pomodoro.todayTasksCounter = Task.getTodayTasksCounter();
		pomodoro._statusBars.updateTasksCounter(pomodoro.todayTasksCounter);
	}

	private async askAboutContinueAfterBreak() {
		const pomodoro = Pomodoro.getInstance();
		pomodoro.stop();
		const response: boolean = await YesNoPrompt(`Continue next task?`);
		if(response) pomodoro.openTodoFile();
	}

	private takeBreak(): void {
		const pomodoro = Pomodoro.getInstance();
		pomodoro.CompleteLastTask();		
		if (pomodoro.breakCounter < getConfig().counter_to_long_break) {
			pomodoro.timer = new Timer(getConfig().break_duration, TimeUnits.Milliseconds);
			pomodoro.breakCounter++;
		} else {
			pomodoro.timer = new Timer(getConfig().long_break_duration, TimeUnits.Milliseconds);
			pomodoro.breakCounter = 0;
		}
		pomodoro.timer.type = TimerType.break;
		pomodoro._statusBars.updateStartBar();
		pomodoro._statusBars.updateCurrentTask();
		pomodoro.timer.start(pomodoro.askAboutContinueAfterBreak);
	}
}