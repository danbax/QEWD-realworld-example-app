import agent from './agent';
import {
  ASYNC_START,
  ASYNC_END,
  LOGIN,
  LOGOUT,
  REGISTER
} from './constants/actionTypes';

const promiseMiddleware = store => next => action => {
  if (isPromise(action.payload)) {
    store.dispatch({ type: ASYNC_START, subtype: action.type });

    const currentView = store.getState().viewChangeCounter;

    action.payload.then(
      res => handlePromiseResolution(store, action, currentView, res),
      error => handlePromiseRejection(store, action, currentView, error)
    );

    return;
  }

  next(action);
};

const localStorageMiddleware = store => next => action => {
  switch (action.type) {
    case REGISTER:
    case LOGIN:
      if (!action.error) {
        const { token } = action.payload.user;
        window.localStorage.setItem('jwt', token);
        agent.setToken(token);
      }
      break;
    case LOGOUT:
      window.localStorage.removeItem('jwt');
      agent.setToken(null);
      break;
  }

  next(action);
};

function isPromise(v) {
  return v && typeof v.then === 'function';
}

function isPromise(v) {
  return v && typeof v.then === 'function';
}

function handlePromiseResolution(store, action, currentView, res) {
  const currentState = store.getState();
  if (!action.skipTracking && currentState.viewChangeCounter !== currentView) {
    return;
  }
  console.log('RESULT', res);
  action.payload = res;
  store.dispatch({ type: ASYNC_END, promise: action.payload });
  store.dispatch(action);
}

function handlePromiseRejection(store, action, currentView, error) {
  const currentState = store.getState();
  if (!action.skipTracking && currentState.viewChangeCounter !== currentView) {
    return;
  }
  console.log('ERROR', error);
  action.error = true;
  action.payload = error.response.body;
  if (!action.skipTracking) {
    store.dispatch({ type: ASYNC_END, promise: action.payload });
  }
  store.dispatch(action);
}

export { promiseMiddleware, localStorageMiddleware };
