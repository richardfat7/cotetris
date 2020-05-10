import 'regenerator-runtime/runtime.js';

import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Switch, Route, browserHistory } from 'react-router-dom';

import Room from './containers/room';
import Tetris from './containers/tetris';

import store from './store';
import './unit/const';
import './control';
import { subscribeRecord } from './unit';

subscribeRecord(store); // 将更新的状态记录到localStorage

// Dont change the order of route, otherwise god will punish you

render(
    <Router history={browserHistory} >
        <Provider store={store}>
            <Switch>
                <Route exact path={'/'} component={Room} history={browserHistory} />
                <Route exact path={'/tetris'} component={Tetris} />
            </Switch>
        </Provider>
    </Router>
    , document.getElementById('root')
);

