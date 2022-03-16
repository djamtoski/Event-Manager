import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, materialize, dematerialize } from 'rxjs/operators';

// array in local storage for registered users
const usersKey = 'FE-TASK-users-registration';
const eventKey = 'FE-TASK-event-management';
let users = JSON.parse(localStorage.getItem(usersKey)) || [];
let events = JSON.parse(localStorage.getItem(eventKey)) || [];

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const { url, method, headers, body } = request;

        return handleRoute();

        function handleRoute() {
            switch (true) {
                case url.endsWith('/users/authenticate') && method === 'POST':
                    return authenticate();
                case url.endsWith('/users/register') && method === 'POST':
                    return register();
                case url.endsWith('/events/create') && method === 'POST':
                  return create();
                case url.endsWith('/events') && method === 'GET':
                    return getEvents();
                case url.match(/\/events\/\d+$/) && method === 'GET':
                    return getEventById();
                case url.match(/\/events\/\d+$/) && method === 'PUT':
                    return updateEvent();
                case url.match(/\/events\/\d+$/) && method === 'DELETE':
                    return deleteEvent();
                default:
                    // pass through any requests not handled above
                    return next.handle(request);
            }
        }

        // route functions

        function authenticate() {
            const { username, password } = body;
            const user = users.find(x => x.username === username && x.password === password);
            if (!user) return error('Username or password is incorrect');
            return ok({
                ...basicDetails(user),
                token: 'fake-jwt-token'
            })
        }

        function register() {
            const user = body

            if (users.find(x => x.username === user.username)) {
                return error('Username "' + user.username + '" is already taken')
            }

            user.id = users.length ? Math.max(...users.map(x => x.id)) + 1 : 1;
            users.push(user);
            localStorage.setItem(usersKey, JSON.stringify(users));
            return ok();
        }

        function create() {
          const event = body
          // Commented out so I can test out events with same names
          // if (events.find(x => x.name === event.name)) {
          //     return error('Event Name "' + event.name + '" is already taken')
          // }

          event.id = events.length ? Math.max(...events.map(x => x.id)) + 1 : 1;
          events.push(event);
          localStorage.setItem(eventKey, JSON.stringify(events));
          return ok();
        }

        function getEvents() {
            if (!isLoggedIn()) return unauthorized();
            return ok(events.map(x => basicDetails(x)));
        }

        function getEventById() {
            if (!isLoggedIn()) return unauthorized();

            const event = events.find(x => x.id === idFromUrl());
            return ok(basicDetails(event));
        }

        function updateEvent() {
            if (!isLoggedIn()) return unauthorized();

            let params = body;
            let event = events.find(x => x.id === idFromUrl());

            // update and save event
            Object.assign(event, params);
            localStorage.setItem(eventKey, JSON.stringify(events));

            return ok();
        }

        function deleteEvent() {
            if (!isLoggedIn()) return unauthorized();

            events = events.filter(x => x.id !== idFromUrl());
            localStorage.setItem(eventKey, JSON.stringify(events));
            return ok();
        }

        // helper functions

        function ok(body?) {
            return of(new HttpResponse({ status: 200, body }))
                .pipe(delay(500)); // delay observable to simulate server api call
        }

        function error(message) {
            return throwError({ error: { message } })
                .pipe(materialize(), delay(500), dematerialize()); // call materialize and dematerialize to ensure delay even if an error is thrown (https://github.com/Reactive-Extensions/RxJS/issues/648);
        }

        function unauthorized() {
            return throwError({ status: 401, error: { message: 'Unauthorized' } })
                .pipe(materialize(), delay(500), dematerialize());
        }

        function basicDetails(event) {
            const { id, name, description , date } = event;
            return { id, name, description, date };
        }

        function isLoggedIn() {
            return headers.get('Authorization') === 'Bearer fake-jwt-token';
        }

        function idFromUrl() {
            const urlParts = url.split('/');
            return parseInt(urlParts[urlParts.length - 1]);
        }
    }
}

export const fakeBackendProvider = {
    // use fake backend in place of Http service for backend-less development
    provide: HTTP_INTERCEPTORS,
    useClass: FakeBackendInterceptor,
    multi: true
};
