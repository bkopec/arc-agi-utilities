// src/app/task-viewer/task-viewer.component.ts
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core'; // <-- NEW IMPORTS
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArcAgiDataService, TaskSets } from '../services/arc-agi-data';
import {Task, TaskExample} from '../services/arc-agi-data';

@Component({
  selector: 'app-task-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-viewer.html',
  styleUrls: ['./task-viewer.css'],
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class TaskViewer implements OnInit {
  taskSets: TaskSets = {};
  task: Task | null = null; 
  availableSetNames: string[] = [];
  currentSetName: string = '';
  currentIndexMap: Map<string, number> = new Map();
  currentTask: string | null = null;
  isLoading: boolean = true;
  error: string | null = null;

  searchTerm: string = ''; 
  searchResult: string | null = null; 

  constructor(
    private arcAgiDataService: ArcAgiDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.arcAgiDataService.getAllTaskSets().subscribe({
      next: (data) => {
        this.taskSets = data;
        this.availableSetNames = Object.keys(data).sort();

        this.availableSetNames.forEach(setName => {
          this.currentIndexMap.set(setName, 0);
        });

        if (this.availableSetNames.length > 0) {
          this.currentSetName = this.availableSetNames[0];
          this.updateCurrentTask();
        } else {
          this.error = "No task sets received from the backend.";
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching task sets:', err);
        this.error = err.message || 'Could not fetch task sets. Is the backend running?';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }


  searchTask(): void {
    this.searchResult = null; 
    const term = this.searchTerm.trim();

    if (!term) {
      this.searchResult = "Please enter a task ID to search.";
      this.cdr.detectChanges();
      return;
    }


    const searchFileName = term.endsWith('.json') ? term : `${term}.json`;

    let found = false;
    for (const setName of this.availableSetNames) {
      const tasksInSet = this.taskSets[setName];
      if (tasksInSet) {
        const index = tasksInSet.indexOf(searchFileName);
        if (index !== -1) {

          this.currentSetName = setName;
          this.currentIndexMap.set(setName, index);
          this.searchResult = `Found '${searchFileName}' in set '${setName}'. Displaying now.`;
          found = true;
          break;
        }
      }
    }

    if (found) {
      this.updateCurrentTask();
    } else {
      this.searchResult = `Task not found: '${searchFileName}' in any dataset.`;
    }
    this.cdr.detectChanges();
  }


  updateCurrentTask(): void {
    const tasks = this.taskSets[this.currentSetName];
    const currentIndex = this.currentIndexMap.get(this.currentSetName) || 0;

    if (tasks && tasks.length > 0 && currentIndex >= 0 && currentIndex < tasks.length) {
      this.currentTask = tasks[currentIndex];
    } else {
      this.currentTask = null;
    }
    this.cdr.detectChanges();

    this.task = null;
    this.cdr.detectChanges();

    if (this.currentTask) {
      this.arcAgiDataService.getTask(this.currentTask).subscribe({
        next: (data: Task) => {
          this.task = data;
          this.cdr.detectChanges(); 
        },
        error: (err) => {
          console.error('Error fetching detailed task:', err);

          this.error = 'Failed to load task details.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  onSetChange(): void {
    this.updateCurrentTask();
  }

  nextTask(): void {
    const tasks = this.taskSets[this.currentSetName];
    let currentIndex = this.currentIndexMap.get(this.currentSetName) || 0;

    if (tasks && currentIndex < tasks.length - 1) {
      this.currentIndexMap.set(this.currentSetName, currentIndex + 1);
      this.updateCurrentTask();
    }
  }

  prevTask(): void {
    let currentIndex = this.currentIndexMap.get(this.currentSetName) || 0;

    if (currentIndex > 0) {
      this.currentIndexMap.set(this.currentSetName, currentIndex - 1);
      this.updateCurrentTask();
    }
  }

  getCurrentTaskIndex(): number {
    return this.currentIndexMap.get(this.currentSetName) || 0;
  }

  getCurrentSetLength(): number {
    return this.taskSets[this.currentSetName]?.length || 0;
  }

  getGridColumns(grid: number[][]): string {
    if (!grid || grid.length === 0) return '1fr';
    return `repeat(${grid[0].length}, 1fr)`; 
  }

  getGridRows(grid: number[][]): string {
    if (!grid || grid.length === 0) return '1fr';
    return `repeat(${grid.length}, 1fr)`; 
  }

}