import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const authReq = token
      ? req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      })
      : req;

  return next(authReq);
};
