'use strict';
import * as vscode from 'vscode';
import { Pomodoro } from './pomodoro';
import { StatusBar } from './ui';

function isSupportedLanguage(textEditor: vscode.TextEditor):boolean {
    return "todo" === textEditor.document.languageId;
}

export function activate(context: vscode.ExtensionContext) {
	const pomodoro = Pomodoro.getInstance();
	const statusBars = StatusBar.getInstance();
	pomodoro.preload();
	statusBars.updateTasksCounter(pomodoro.completedTasksCounter, pomodoro.tasks.length);
    let disposable = vscode.commands.registerTextEditorCommand('todopomo.start', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
            if (isSupportedLanguage(textEditor)) {
                //new TodoDocumentEditor(textEditor, edit).createNewTask();
                // TODO: create that task string(?)
                    let task = {};
                    let pomodoro = Pomodoro.getInstance(textEditor, edit);
                    pomodoro.start();
            }
        });
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(`todopomo.pause`, () => pomodoro.pause());	
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(`todopomo.stop`, () => pomodoro.stop());	
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(`todopomo.report`, () => pomodoro.report());	
    context.subscriptions.push(disposable);
}
