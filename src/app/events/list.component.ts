import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';

import { AccountService } from '@app/_services';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    events = null;

    constructor(private accountService: AccountService) {}

    ngOnInit() {
        this.accountService.getAll()
            .pipe(first())
            .subscribe(events => this.events = events);
    }

    deleteEvent(id: string) {
        const event = this.events.find(x => x.id === id);
        event.isDeleting = true;
        if(window.confirm('Are you sure you want to delete?')) {
          this.accountService.delete(id)
              .pipe(first())
              .subscribe(() => this.events = this.events.filter(x => x.id !== id));
        }
        else {
          event.isDeleting = false;
        }
    }
}
