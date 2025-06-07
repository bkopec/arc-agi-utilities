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
  changeDetection: ChangeDetectionStrategy.OnPush // <-- NEW: Tell Angular to only check on push or manual trigger
})
export class TaskViewer implements OnInit {
  taskSets: TaskSets = {};
  task: Task | null = null; // <-- CHANGED TYPE HERE to Task | null
  availableSetNames: string[] = [];
  currentSetName: string = '';
  currentIndexMap: Map<string, number> = new Map();
  currentTask: string | null = null;
  isLoading: boolean = true;
  error: string | null = null;

  searchTerm: string = ''; // New: Binds to the search input
  searchResult: string | null = null; // New: Displays search messages

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

  /**
   * New: Searches for a task ID across all available datasets.
   */
  searchTask(): void {
    this.searchResult = null; // Clear previous search result
    const term = this.searchTerm.trim();

    if (!term) {
      this.searchResult = "Please enter a task ID to search.";
      this.cdr.detectChanges();
      return;
    }

    // Ensure the term ends with .json if not already for robust matching
    const searchFileName = term.endsWith('.json') ? term : `${term}.json`;

    let found = false;
    for (const setName of this.availableSetNames) {
      const tasksInSet = this.taskSets[setName];
      if (tasksInSet) {
        const index = tasksInSet.indexOf(searchFileName); // indexOf for exact match
        if (index !== -1) {
          // Task found!
          this.currentSetName = setName; // Switch to the set where it was found
          this.currentIndexMap.set(setName, index); // Set the index to the found task
          this.searchResult = `Found '${searchFileName}' in set '${setName}'. Displaying now.`;
          found = true;
          break; // Exit the loop once found
        }
      }
    }

    if (found) {
      this.updateCurrentTask(); // Update the displayed task
    } else {
      this.searchResult = `Task not found: '${searchFileName}' in any dataset.`;
    }
    this.cdr.detectChanges(); // Trigger change detection to update UI
  }


  updateCurrentTask(): void {
    const tasks = this.taskSets[this.currentSetName];
    const currentIndex = this.currentIndexMap.get(this.currentSetName) || 0;

    if (tasks && tasks.length > 0 && currentIndex >= 0 && currentIndex < tasks.length) {
      this.currentTask = tasks[currentIndex];
    } else {
      this.currentTask = null;
    }
    this.cdr.detectChanges(); // Update UI for `this.currentTask`

    // Reset detailed task object while fetching new one
    this.task = null;
    this.cdr.detectChanges(); // To clear previous task data from view quickly

    // Call service to get full task details (asynchronous)
    if (this.currentTask) {
      this.arcAgiDataService.getTask(this.currentTask).subscribe({
        next: (data: Task) => { // <-- Explicitly type 'data' as Task
          this.task = data; // Assign the detailed task object
          this.cdr.detectChanges(); // Update UI after 'this.task' is updated by async call
        },
        error: (err) => {
          console.error('Error fetching detailed task:', err);
          // Handle error for detailed task fetch if needed
          this.error = 'Failed to load task details.'; // Example error handling
          this.cdr.detectChanges(); // Update UI for error
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