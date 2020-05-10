import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import Tetris from './containers/tetris';

import store from './store';

import './unit/const';
import './control';
import { subscribeRecord } from './unit';

subscribeRecord(store); // 将更新的状态记录到localStorage

render(
    <Provider store={store}>
        <Tetris />
    </Provider>
    , document.getElementById('root')
);

