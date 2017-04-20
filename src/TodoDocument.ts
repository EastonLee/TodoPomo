'use strict';

import {TextDocument, TextLine, Position, CompletionItem, Range, TextEditor} from 'vscode';

export class TodoDocument {
    
    public static SYMBOL_PROJECT= ":";
    public static SYMBOL_NEW_TASK= "☐";
    public static SYMBOL_DONE_TASK= "✔";
    public static SYMBOL_CANCEL_TASK= "✘";
    public static SYMBOL_TAG= "@";

    public static TAG_CRITICAL= "critical";
    public static TAG_HIGH= "high";
    public static TAG_LOW= "low";
    public static TAG_TODAY= "today";

    public static ACTION_DONE= "done";
    public static ACTION_CANCELLED= "cancelled";

    constructor(private _textDocument: TextDocument) {
    }

    public static isSupportedLanguage(textEditor: TextEditor):boolean {
        return "todo" === textEditor.document.languageId;
    }
    public getProject(pos: Position): Project {
        let line= this._textDocument.lineAt(pos.line)
        let projectText= line.text.trim();
        if (projectText.endsWith(TodoDocument.SYMBOL_PROJECT)) {
            return new Project(line);
        }
        return null;
    }

    public getParentProject(cur_line_num: number): Array<string> {
        let line= this._textDocument.lineAt(cur_line_num)
        let parentProjects = [];
        let line_num = line.lineNumber;
        let rev_prev_line_nums = [];
        for (let i=line_num ; i>=0; i--){
            rev_prev_line_nums.push(i);
        }
        rev_prev_line_nums.slice(0, 1);
        let lines = rev_prev_line_nums.map(this._textDocument.lineAt);
        let min_indent = line.firstNonWhitespaceCharacterIndex;
        lines.forEach((l: TextLine)=>{
            if (l.text.trim() === "") return;
            let cur_indent = l.firstNonWhitespaceCharacterIndex;
            if (cur_indent < min_indent){
                min_indent = cur_indent;
                parentProjects.splice(0,0, l.text.trim());
            }
        });
        console.log(parentProjects);
        return parentProjects;
    }

    public getTasks(): Task[] {
        let result: Task[]= [];
        var text= this._textDocument.getText();
        var regEx= /^\s*[☐|✘|✔]/gm;
        var match;
        while (match = regEx.exec(text)) {
            let line= this._textDocument.lineAt(this._textDocument.positionAt(match.index + 1).line);
            result.push(new Task(line));
        }
        return result;
    }

    public getTaskPlusProjects(pos: Position): TaskPlusProject {
        if (!this.isTodoTask(pos)) {
            console.log('this is not a Todo task')
            return null;
        }

        let line= this._textDocument.lineAt(pos.line);
        let line_plus_project = this.getParentProject(line.lineNumber);
        let line_plus_project_str = line_plus_project.join(' ') + line.text.trim();
        return new TaskPlusProject(line_plus_project_str);
    }

    public isTask(pos: Position): boolean {
        let task= this._textDocument.lineAt(pos.line).text.trim();
        return task.startsWith(TodoDocument.SYMBOL_NEW_TASK) 
                    || task.startsWith(TodoDocument.SYMBOL_CANCEL_TASK)
                    || task.startsWith(TodoDocument.SYMBOL_DONE_TASK);
    }
    public isTodoTask(pos: Position): boolean {
        let task= this._textDocument.lineAt(pos.line).text.trim();
        return task.startsWith(TodoDocument.SYMBOL_NEW_TASK);
    }

    public static toTag(tagName: string): string {
        return TodoDocument.SYMBOL_TAG + tagName;
    }
}

export class Task {
    
    private taskText: string;

    constructor(public taskLine: TextLine) {
        this.taskText= taskLine.text.trim();
    }

    public getDescription(): string {
        if (this.isDone()) {
            let index= this.taskText.indexOf(TodoDocument.toTag(TodoDocument.ACTION_DONE));
            return index !== -1 ? this.taskText.substring(TodoDocument.SYMBOL_DONE_TASK.length, index).trim()
                                       : this.taskText.substring(TodoDocument.SYMBOL_DONE_TASK.length).trim();
        }
        if (this.isCancelled()) {
            var index= this.taskText.indexOf(TodoDocument.toTag(TodoDocument.ACTION_CANCELLED));
            return index !== -1 ? this.taskText.substring(TodoDocument.SYMBOL_CANCEL_TASK.length, index).trim()
                                       : this.taskText.substring(TodoDocument.SYMBOL_CANCEL_TASK.length).trim();
        }
        return this.taskText.substring(TodoDocument.SYMBOL_NEW_TASK.length).trim();
    }

    public isEmpty(): boolean {
        return !this.getDescription().trim();
    }

    public isDone(): boolean {
        return this.taskText.indexOf(TodoDocument.SYMBOL_DONE_TASK) !== -1;
    }

    public isCancelled(): boolean {
        return this.taskText.indexOf(TodoDocument.SYMBOL_CANCEL_TASK) !== -1;
    }

    public hasTag(tag: string): boolean {
        return this.taskText.toLocaleLowerCase().indexOf(TodoDocument.toTag(tag).toLocaleLowerCase()) !== -1;
    }

    public getTagRanges(tag: string): Range[] {
        var result:Range[]= [];
        var regEx= /@[^@\s]+/g  ;
        var match;
        while (match = regEx.exec(this.taskText)) {
            if (TodoDocument.toTag(tag).toLocaleLowerCase() === match[0].toLocaleLowerCase()) {
                let start:Position= this.taskLine.range.start;
                let lineText:string= this.taskLine.text;
                let startPosition= new Position(start.line, this.taskLine.firstNonWhitespaceCharacterIndex + match.index);
                let endPosition= new Position(start.line, this.taskLine.firstNonWhitespaceCharacterIndex + match.index + match[0].length);
                result.push(new Range(startPosition, endPosition));
            }
        }
        return result;
    }

    public getTags(): string[] {
        var result= [];
        var regEx= /@[^@\s]+/g  ;
        var match;
        while (match = regEx.exec(this.taskText)) {
            if (TodoDocument.toTag(TodoDocument.ACTION_CANCELLED) !== match[0] && TodoDocument.toTag(TodoDocument.ACTION_DONE) !== match[0]) {
                result.push(match[0]);
            }
        }
        return result;

    }

    public getTagsRanges(): Range[] {
        var result:Range[]= [];
        var regEx= /@[^@\s]+/g  ;
        var match;
        while (match = regEx.exec(this.taskText)) {
            if (TodoDocument.toTag(TodoDocument.ACTION_CANCELLED) !== match[0] && TodoDocument.toTag(TodoDocument.ACTION_DONE) !== match[0]) {
                let start:Position= this.taskLine.range.start;
                let lineText:string= this.taskLine.text;
                let startPosition= new Position(start.line, this.taskLine.firstNonWhitespaceCharacterIndex + match.index);
                let endPosition= new Position(start.line, this.taskLine.firstNonWhitespaceCharacterIndex + match.index + match[0].length);
                result.push(new Range(startPosition, endPosition));
            }
        }
        return result;
    }
}

class TaskPlusProject{
    constructor(private task: string){
    };
    public getTask(){
        return this.task;
    }
}

export class Project {
    constructor(public line: TextLine) {
    }
}