import routeConfig from './config';
import { isFunction } from 'lodash';

export default (router) => {
  routeConfig.forEach(({ url, type: method, handler, middleware = null }) => {
    if (isFunction(handler)) {
      if (middleware) {
        router[method](url, middleware, handler);
      } else {
        router[method](url, handler);
      }
    }
  });

  return router;
};
