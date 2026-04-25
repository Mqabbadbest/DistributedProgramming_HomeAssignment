import { HttpInterceptorFn } from '@angular/common/http';

/**
 * An HTTP interceptor function that adds a JWT to the request headers
 * if the token is available in the browser's local storage.
 *
 * @param req - The outgoing HTTP request object.
 * @param next - A function to pass the modified or unmodified request to the next handler in the chain.
 * @returns The result of passing the cloned request (with the Authorization header) or the original request to the next handler.

 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Interceptor called');
  const session = localStorage.getItem('sessionToken');

  if (session) {
    const cloned = req.clone({
      headers: req.headers.set('x-session-token', session),
    });

    return next(cloned);
  } else {
    return next(req);
  }
};
