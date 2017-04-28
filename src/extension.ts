'use strict';
import * as vscode from 'vscode';
import { Pomodoro } from './pomodoro';
import { StatusBar } from './ui';

export function activate(context: vscode.ExtensionContext) {
	const pomodoro = Pomodoro.getInstance(true);
	const statusBars = StatusBar.getInstance();
	statusBars.updateTasksCounter(pomodoro.todayTasksCounter);
    let disposable = vscode.commands.registerTextEditorCommand('todopomo.start', pomodoro.start);
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(`todopomo.stop`, pomodoro.stop);	
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(`todopomo.startOrStop`, pomodoro.toggle);	
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(`todopomo.report`, pomodoro.report);	
    context.subscriptions.push(disposable);
}
