import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define a type for the structure of your task sets from the backend
// The backend returns a JSON object, which TypeScript represents as a Record
export type TaskSets = Record<string, string[]>;

export interface TaskExample {
  input: number[][]; // 2D array of numbers
  output: number[][]; // 2D array of numbers
}

export interface Task {
  train: TaskExample[];
  test: TaskExample[];
}

@Injectable({
  providedIn: 'root'
})
export class ArcAgiDataService {
  private apiUrl = 'http://localhost:8080/api/'; // Adjust if your backend port is different

  constructor(private http: HttpClient) { }

  /**
   * Fetches all hardcoded task sets from the Spring Boot backend.
   * @returns An Observable of a map where keys are set names and values are arrays of task filenames.
   */
  getAllTaskSets(): Observable<TaskSets> {
    return this.http.get<TaskSets>(this.apiUrl + 'task-sets/all');
  }

  getTask(taskId: string): Observable<Task> { // <-- CHANGE THIS RETURN TYPE from TaskSets to Task
    return this.http.get<Task>(`${this.apiUrl}task/${taskId}`);
  }
}