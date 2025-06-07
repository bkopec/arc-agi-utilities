import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaskViewer } from './task-viewer/task-viewer';

@Component({
  selector: 'app-root',
  imports: [TaskViewer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'arc-agi-viewer-front';
}
