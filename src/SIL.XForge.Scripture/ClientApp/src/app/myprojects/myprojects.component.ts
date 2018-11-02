import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatTableDataSource } from '@angular/material';
import { Router } from '@angular/router';
import { ProjectUserService } from '@xforge-common/project-user.service';
import { ProjectService } from '@xforge-common/project.service';
import { SFProjectUser } from '../shared/models/sfproject-user';
import { SFProjectUserService } from './../core/sfproject-user.service';

export interface Project {
  projectName: string;
  isMember: boolean;
}

@Component({
  selector: 'app-myprojects',
  templateUrl: './myprojects.component.html',
  styleUrls: ['./myprojects.component.scss']
})

export class MyprojectsComponent implements OnInit {
  firstNameAutofilled: boolean = true;
  displayedColumns: string[] = ['id', 'name'];
  project1: any[] = [];
  dataSource = new MatTableDataSource<Project>(this.project1);
  projectCount: number = 0;
  sfProjectUser: SFProjectUser;
  role: string;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private sfProjectUserService: ProjectService, private router: Router,
    private readonly projectService: ProjectUserService) {
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  ngOnInit() {
    this.getProjectUser();
    this.projectCount = this.dataSource.data.length;
    this.role = 'system_admin';
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.projectCount = this.dataSource.filteredData.length;
  }

  getProjectUser(): void {
    this.sfProjectUserService.onlineGetAllProject().subscribe(response => {
      if (response != null) {
        this.dataSource.data = response;
        this.projectCount = this.dataSource.data.length;
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  isMemberCheck(userCollection: any[], userId: string): boolean {
    if (userCollection.filter(m => m.id === userId)) {
      return true;
    } else {
      return false;
    }
  }
  btnConnectParatext = function () {
    this.router.navigateByUrl('/connect-to-Paratext');
  };

  btnMember = function () {
  };
}
