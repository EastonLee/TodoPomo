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
                let task = {};
                let pomodoro = Pomodoro.getInstance();
                pomodoro.start();
            }
        });
    }

    private isSupportedLanguage(textEditor: TextEditor):boolean {
        return "todo" === textEditor.document.languageId;
    }
}

interface CommandObject {
    label: string;
    command: string; 
}

export class TodoCommandsProvider {

    private static COMMANDS: CommandObject[]= [{label: TodoDocument.toTag(TodoDocument.ACTION_DONE), command: "Ctrl+Shift+d"},
                                    {label: TodoDocument.toTag(TodoDocument.ACTION_CANCELLED), command: "Ctrl+Shift+c"}];

    public static getCommands(filter?: string):Promise<CompletionItem[]> {
        let filtered= TodoCommandsProvider.COMMANDS.filter((commandObject: CommandObject, index: number, collection: CommandObject[]): boolean =>{
                            return !filter || commandObject.label.indexOf(filter) !== -1
                        });
        let result= filtered.map((commandObject: CommandObject, index: number, collection: CommandObject[]): CompletionItem =>{
                            var completionItem= new CompletionItem(commandObject.label);
                            return completionItem;
                        });
        return Promise.resolve(result);
    } 
}