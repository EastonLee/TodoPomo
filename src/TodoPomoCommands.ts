'use strict';

import { commands, TextEditor, TextEditorEdit, CompletionItem, TextEdit, window} from 'vscode';
import {Pomodoro} from './pomodoro';
import { TodoDocument } from './TodoDocument';
// import { TodoDocumentEditor } from './TodoDocumentEditor';

export class TodoPomoCommands {
    
    public static START_TASK= "todopomo.start";

    public registerStartTaskCommand() {
        return commands.registerTextEditorCommand(TodoPomoCommands.START_TASK, (textEditor: TextEditor, edit: TextEditorEdit) => {
            if (this.isSupportedLanguage(textEditor)) {
                //new TodoDocumentEditor(textEditor, edit).createNewTask();
                // TODO: create that task string(?)
                if (this.isSupportedLanguage(textEditor)) {
                    let task = {};
                    let pomodoro = Pomodoro.getInstance(textEditor, edit);
                    pomodoro.start();
                }
            }
        });
    }

    private isSupportedLanguage(textEditor: TextEditor):boolean {
        return "todo" === textEditor.document.languageId;
    }
}
