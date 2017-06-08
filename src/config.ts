import { workspace } from 'vscode';
import { TimeUnits } from './timer';

import path = require('path');

const DEFAULT_TASK_DURATION = 25 * TimeUnits.Minute;
const DEFAULT_BREAK_DURATION = 5 * TimeUnits.Minute;
const DEFAULT_LONG_BREAK_DURATION = 15 * TimeUnits.Minute;

const COUNTER_TO_LONG_BREAK = 3;

export interface Config {
    task_duration: number,
    break_duration: number,
    long_break_duration: number,
    counter_to_long_break: number, 
    tasks_file: string,
    sound_file: string,
    after_task_sound_file: string,
    after_break_sound_file: string,
    sound_volume: number,
    reminder: boolean
}

export function getConfig(): Config {
    let configuration;
    try {
        configuration = workspace.getConfiguration('todopomo');
    } catch (error) {}    
    let home_path = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME
    return {
      task_duration: configuration.task_duration * TimeUnits.Minute || DEFAULT_TASK_DURATION,
      break_duration: configuration.break_duration * TimeUnits.Minute || DEFAULT_BREAK_DURATION,
      long_break_duration: configuration.long_break_duration * TimeUnits.Minute || DEFAULT_LONG_BREAK_DURATION,
      counter_to_long_break: configuration.counter_to_long_break || COUNTER_TO_LONG_BREAK, 
      todo_file: configuration.todo_file || path.join(home_path, `.everything.todo`),
      tasks_file: configuration.tasks_file || path.join(home_path, `.todopomo.json`),
      sound_file: configuration.sound_file === ""? null : path.join(__dirname, '..', '..', configuration.sound_file),
      sound_volume: configuration.sound_volume || 100,
      after_task_sound_file: configuration.after_task_sound_file || path.join(__dirname, `../../sounds/alarm.aac`),
      after_break_sound_file: configuration.after_break_sound_file || path.join(__dirname, `../../sounds/alarm.aac`),
      reminder: configuration.reminder
    } as Config;
}