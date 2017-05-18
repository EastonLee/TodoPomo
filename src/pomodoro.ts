import * as vscode from 'vscode';
import { Task } from './task';
import { TimeUnits, Timer, TimerType } from './timer';
import { getConfig } from './config';
import { YesNoPrompt, InputPrompt, StatusBar } from './ui';
import { TaskStorage } from './storage';
import { TextDocument, TextLine, Position, CompletionItem, Range } from 'vscode';
import { TextEditor, TextEditorEdit } from 'vscode';
import { TodoDocument } from './TodoDocument';
import { Sound } from './sounds';
import fs = require('fs');

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

	public static getInstance(load: Boolean=false): Pomodoro {
		// easton: only todopomo.start command need textEditor	
		if (Pomodoro._instance === null || Pomodoro._instance === undefined) {
			Pomodoro._instance = new Pomodoro();
		}
		if (load) Pomodoro._instance.loadTasks();
		return Pomodoro._instance;
	}

	public loadTasks() {
		const pomodoro: Pomodoro = this;
		pomodoro._storage.load(pomodoro);

		for (let taskIndex in pomodoro.tasks) {
			if (pomodoro.tasks[taskIndex].startTime === null) {
				break;
			}
			else {
				if (pomodoro.tasks[taskIndex].isCompleted) {
					pomodoro.completedTasksCounter++;
				}
			}
		}
		this.todayTasksCounter = Task.getTodayTasksCounter(pomodoro.tasks);
	}

	public openTodoFile(): TextEditor {
		let textEditor: TextEditor = vscode.window.activeTextEditor;
		if (!TodoDocument.isSupportedLanguage(textEditor)) {
			if (!fs.existsSync(getConfig()['todo_file'])) {
				fs.closeSync(fs.openSync(getConfig()['todo_file'], 'w'));
			}
			let openPath = vscode.Uri.file(getConfig()['todo_file']);
			vscode.workspace.openTextDocument(openPath).then(doc => {
				vscode.window.showTextDocument(doc);
			});
			return
		}
		return textEditor;
	}

	public start() {
		const pomodoro = Pomodoro.getInstance(true);
		let textEditor = pomodoro.openTodoFile();
		if (!textEditor) return

		pomodoro.textEditor = textEditor;
		if (pomodoro.timer && pomodoro.timer.type === TimerType.task) {
			console.log('There is task running, stop previous one first.')
			return
		}
		let doc_task = new TodoDocument(pomodoro.textEditor.document).getTaskPlusProjects(pomodoro.textEditor.selection.start);
		if (doc_task) {
			pomodoro.task = new Task(doc_task.getTask(), null);
			// pomodoro.task = new Task(doc_task.getTask(), new Date().toLocaleString());
			console.log('old tasks length:', pomodoro.tasks.length);
			pomodoro.tasks.push(pomodoro.task);
			console.log('new tasks length:', pomodoro.tasks.length);
			if (pomodoro.timer) {
				console.log('timer running,', pomodoro.timer)
				pomodoro.timer.stop();
			}
			// timing matters: must save after this task has startTime, 
			// and before updateStartBar refresh pomodoro.tasks
			console.log('new tasks length:', pomodoro.tasks.length);
			pomodoro.timer = pomodoro.task.startTask(pomodoro.takeBreak, getConfig().sound_file, getConfig().sound_volume);
			console.log('new tasks length:', pomodoro.tasks.length);
			pomodoro._storage.save(pomodoro.tasks);
			pomodoro.timer.type = TimerType.task;
			pomodoro._statusBars.updateTasksCounter(pomodoro.todayTasksCounter);
			pomodoro._statusBars.updateStartBar();
			pomodoro._statusBars.updateCurrentTask();
		}
	}

	public stop() {
		// const pomodoro = Pomodoro.getInstance();
		const pomodoro = this;
		pomodoro.timer.reset();
		pomodoro.timer = null;
		pomodoro._statusBars.updateStartBar();
		pomodoro._statusBars.updateTimerBar(0);
		pomodoro._statusBars.updateCurrentTask();
	}

	public toggle() {
		const pomodoro = Pomodoro.getInstance(true);
		if (pomodoro.timer && pomodoro.timer.type === TimerType.task) pomodoro.stop();
		else pomodoro.start();
	}

	// TODO
	public report() {
		const pomodoro = Pomodoro.getInstance(true);
	}

	public CompleteLastTask() {
		const pomodoro = Pomodoro.getInstance(true);
		let lastTask = pomodoro.tasks[pomodoro.tasks.length - 1];
		lastTask.isCompleted = true;
		pomodoro._storage.save(pomodoro.tasks);
		pomodoro.task = null;
		pomodoro.todayTasksCounter = Task.getTodayTasksCounter(pomodoro.tasks);
		pomodoro._statusBars.updateTasksCounter(pomodoro.todayTasksCounter);
	}

	private async askAboutContinueAfterBreak() {
		const pomodoro = Pomodoro.getInstance(true);
		pomodoro.stop();
		Sound.play(getConfig().after_break_sound_file);
		const response: boolean = await YesNoPrompt(`Continue next task?`);
		if (response) pomodoro.openTodoFile();
	}

	private takeBreak(): void {
		Sound.play(getConfig().after_task_sound_file);
		const pomodoro = Pomodoro.getInstance(true);
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