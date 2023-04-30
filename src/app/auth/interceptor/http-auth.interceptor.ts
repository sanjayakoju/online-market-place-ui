import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { Credentials, CredentialsService } from '../services/credentials.service';
import { AuthenticationService } from '../services/authentication.service';
import { QueryParamUIKey } from '@app/core/core.constant';
import { APP_UI_ROUTES } from '@app/core/route.util';

@Injectable()
export class HttpAuthInterceptor implements HttpInterceptor {

  constructor(private router: Router,
    private credentialsService: CredentialsService,
    private authenticationService: AuthenticationService) {
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let clonedRequest = request.clone({});
    const credentails: Credentials | null = this.credentialsService.getCredentials();
    if (this.credentialsService.isAuthenticated() && (credentails != null)) {
      clonedRequest = request.clone({
        setHeaders: {
          Authorization: 'Bearer ' + credentails?.token
        }
      });
    }

    return next.handle(clonedRequest)
      .pipe(
        map((event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            console.log('Http Response event... ' + event.status);
          }
          return event;
        }),
        catchError(error => {
          console.log('Error response status: ', error.status);
          const indexOfQueryParams = this.router.url.lastIndexOf('?');
          const lastIndexOfUrl = indexOfQueryParams > 0 ? indexOfQueryParams : this.router.url.length;
          const urlPath = this.router.url.substr(0, lastIndexOfUrl);
          const originalRequestedUri = urlPath && urlPath.length > 0 && urlPath ? urlPath : APP_UI_ROUTES.HOME;

          // Error Status 401: UnAuthorized Access
          // if (error.status === 401) {
          //   const wasAuthenticated = this.credentialsService.isAuthenticated();
          //   const UnAuthorizedAccessMsg = wasAuthenticated ? 'Session Timeout, Invalid Session ID !!!' : 'Un-Authorized Access ! Please Login !!!';
          //   this.authenticationService.logout(false);
          //   this.router.navigate([APP_UI_ROUTES.LOGIN],
          //     {
          //       queryParams: {
          //         [QueryParamUIKey.ORIGINAL_REQUEST_URI]: originalRequestedUri,
          //         [QueryParamUIKey.DEFAULT_INFO_MESSAGE]: UnAuthorizedAccessMsg
          //       },
          //       replaceUrl: true
          //     });
          // }
          // // Error Status 403: Forbidden Access
          // if (error.status === 403) {
          //   this.router.navigate([APP_UI_ROUTES.LOGIN],
          //     {
          //       queryParams: {
          //         [QueryParamUIKey.ORIGINAL_REQUEST_URI]: originalRequestedUri,
          //         [QueryParamUIKey.DEFAULT_INFO_MESSAGE]: 'Forbidden, Please login with elevated credentials'
          //       },
          //       replaceUrl: true
          //     });
          // }

          return throwError(error);
        }));

  }
}
