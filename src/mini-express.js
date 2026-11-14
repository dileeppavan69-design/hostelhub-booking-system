/**
 * HostelHub Zero-Dependency Express Compatibility Layer
 * Follows the standard Express sequential middleware and route stack architecture
 */

const http = require('http');
const url = require('url');

function normalizePath(p) {
  if (!p || p === '/') return '/';
  return p.replace(/\/+$/, '');
}

function pathToRegex(path) {
  const norm = normalizePath(path);
  if (norm === '/') {
    return /^\/?$/;
  }
  const pattern = norm
    .replace(/\/:([a-zA-Z0-9_]+)/g, '/([^/]+)')
    .replace(/\//g, '\\/');
  return new RegExp(`^${pattern}\\/?$`);
}

function pathToKeys(path) {
  const matches = path.match(/:([a-zA-Z0-9_]+)/g) || [];
  return matches.map((m) => m.substring(1));
}

function createRouter() {
  const stack = [];

  function use(...args) {
    if (args.length === 1 && typeof args[0] === 'function') {
      stack.push({ type: 'middleware', path: '', fn: args[0] });
    } else if (args.length === 2 && typeof args[1] === 'function') {
      stack.push({ type: 'middleware', path: normalizePath(args[0]), fn: args[1] });
    } else if (args.length === 2 && args[1].isRouter) {
      // Sub-router mount
      const prefix = normalizePath(args[0]);
      const subRouter = args[1];
      for (const item of subRouter.stack) {
        if (item.type === 'route') {
          const fullPath = item.path === '/' ? prefix : `${prefix}${item.path}`;
          stack.push({
            type: 'route',
            method: item.method,
            path: fullPath,
            regex: pathToRegex(fullPath),
            keys: pathToKeys(fullPath),
            handlers: item.handlers
          });
        } else if (item.type === 'middleware') {
          const fullPath = item.path === '/' ? prefix : `${prefix}${item.path}`;
          stack.push({
            type: 'middleware',
            path: fullPath,
            fn: item.fn
          });
        }
      }
    }
  }

  function addRoute(method, path, ...handlers) {
    stack.push({
      type: 'route',
      method: method.toUpperCase(),
      path,
      regex: pathToRegex(path),
      keys: pathToKeys(path),
      handlers
    });
  }

  function get(path, ...handlers) { addRoute('GET', path, ...handlers); }
  function post(path, ...handlers) { addRoute('POST', path, ...handlers); }
  function put(path, ...handlers) { addRoute('PUT', path, ...handlers); }
  function del(path, ...handlers) { addRoute('DELETE', path, ...handlers); }

  return {
    isRouter: true,
    stack,
    use,
    get,
    post,
    put,
    delete: del
  };
}

function createApp() {
  const router = createRouter();

  const app = function (req, res) {
    handleRequest(req, res, router);
  };

  Object.assign(app, router);

  app.listen = function (port, callback) {
    const server = http.createServer((req, res) => {
      handleRequest(req, res, router);
    });
    return server.listen(port, callback);
  };

  return app;
}

function handleRequest(req, res, router) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname || '/';

  req.query = parsedUrl.query || {};
  req.params = {};

  // Augment res
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };

  res.json = function (data) {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
    }
    res.end(JSON.stringify(data));
    return res;
  };

  res.send = function (data) {
    if (typeof data === 'object') {
      return res.json(data);
    }
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/html');
    }
    res.end(data);
    return res;
  };

  // Collect request body
  let bodyBuffer = '';
  req.on('data', (chunk) => {
    bodyBuffer += chunk.toString();
  });

  req.on('end', async () => {
    req.body = {};
    if (bodyBuffer) {
      try {
        req.body = JSON.parse(bodyBuffer);
      } catch (e) {
        req.body = bodyBuffer;
      }
    }

    const method = req.method.toUpperCase();
    let index = 0;

    async function next(err) {
      if (err) {
        console.error('Middleware/Route Error:', err);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
      }

      if (index >= router.stack.length) {
        if (!res.headersSent) {
          res.status(404).json({ error: 'Not Found', message: `Cannot ${method} ${pathname}` });
        }
        return;
      }

      const item = router.stack[index++];

      if (item.type === 'middleware') {
        const matchesPath = !item.path || pathname === item.path || pathname.startsWith(item.path + '/');
        if (matchesPath) {
          try {
            // Check if middleware expects err parameter
            if (item.fn.length === 4) {
              return next();
            }
            return item.fn(req, res, next);
          } catch (e) {
            return next(e);
          }
        } else {
          return next();
        }
      }

      if (item.type === 'route') {
        if (item.method === method) {
          const match = pathname.match(item.regex);
          if (match) {
            req.params = {};
            item.keys.forEach((key, i) => {
              req.params[key] = decodeURIComponent(match[i + 1]);
            });

            // Execute handlers in chain
            let hIndex = 0;
            function runHandler() {
              if (hIndex >= item.handlers.length) {
                return next();
              }
              const handler = item.handlers[hIndex++];
              try {
                return handler(req, res, runHandler);
              } catch (e) {
                return next(e);
              }
            }
            return runHandler();
          }
        }
        return next();
      }

      return next();
    }

    await next();
  });
}

createApp.Router = createRouter;
createApp.json = function () {
  return function (req, res, next) {
    next();
  };
};

module.exports = createApp;
