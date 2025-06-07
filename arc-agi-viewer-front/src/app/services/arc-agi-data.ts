import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


export type TaskSets = Record<string, string[]>;

export interface TaskExample {
  input: number[][];
  output: number[][];
}

export interface Task {
  train: TaskExample[];
  test: TaskExample[];
}

@Injectable({
  providedIn: 'root'
})
export class ArcAgiDataService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }


  getAllTaskSets(): Observable<TaskSets> {
    return this.http.get<TaskSets>(this.apiUrl + 'task-sets/all');
  }

  getTask(taskId: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}task/${taskId}`);
  }
}