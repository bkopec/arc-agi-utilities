import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskViewer } from './task-viewer';

describe('TaskViewer', () => {
  let component: TaskViewer;
  let fixture: ComponentFixture<TaskViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskViewer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskViewer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
