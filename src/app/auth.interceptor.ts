import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let modifiedReq = req;

  if (req.method === 'GET') {
    const params = req.params.set('_t', Date.now().toString());
    modifiedReq = req.clone({ params });
  }

  if (token) {
    modifiedReq = modifiedReq.clone({
      headers: modifiedReq.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(modifiedReq);
};
