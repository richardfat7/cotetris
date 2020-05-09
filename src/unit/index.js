import { blockType, StorageKey, StorageHold, blankMatrix } from './const';

const hiddenProperty = (() => { // document[hiddenProperty] 可以判断页面是否失焦
    let names = [
        'hidden',
        'webkitHidden',
        'mozHidden',
        'msHidden',
    ];

    names = names.filter((e) => (e in document));

    return names.length > 0 ? names[0] : false;
})();

const visibilityChangeEvent = (() => {
    if (!hiddenProperty) {
        return false;
    }

    return hiddenProperty.replace(/hidden/i, 'visibilitychange'); // 如果属性有前缀, 相应的事件也有前缀
})();

const isFocus = () => {
    if (!hiddenProperty) { // 如果不存在该特性, 认为一直聚焦
        return true;
    }

    return !document[hiddenProperty];
};

export function getNextType(type) { // 随机获取下一个方块类型
    if (type === undefined) {
        const len = blockType.length - 1;

        return blockType[Math.floor(Math.random() * len)];
    }

    return blockType[type];
}

export function want(next, matrix) { // 方块是否能移到到指定位置
    const xy = next.xy;
    const shape = next.shape;

    return shape.every((m) => {
        if (xy[1] + m.get(0) < 0) { // left
            return false;
        }

        if (xy[1] + m.get(0) >= 10) { // right
            return false;
        }

        if (xy[0] + m.get(1) < 0) { // top
            return true;
        }

        if (xy[0] + m.get(1) >= 20) { // bottom
            return false;
        }

        if (matrix.get(xy[0] + m.get(1)).get(xy[1] + m.get(0))) {
            return false;
        }

        return true;
    });
}

export function wantHardDrop(cur, cur2) {
    let matrix = blankMatrix;
    const shape = cur && cur.shape;
    const xy = cur && cur.xy;
    const shape2 = cur2 && cur2.shape;
    const xy2 = cur2 && cur2.xy;

    shape2.forEach((m) => {
        if (xy2.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
            let line = matrix.get(xy2.get(0) + m.get(1));

            line = line.set(xy2.get(1) + m.get(0), 1);
            matrix = matrix.set(xy2.get(0) + m.get(1), line);
        }
    });

    return shape.some((m) => {
        for (let i = xy.get(0) + m.get(1); i < 20; i++) {
            if (matrix.get(i).get(xy.get(1) + m.get(0))) {
                return true;
            }
        }

        return false;
    });
}

export function isClear(matrix) { // 是否达到消除状态
    const clearLines = [];

    matrix.forEach((m, k) => {
        if (m.every(n => !!n)) {
            clearLines.push(k);
        }
    });
    if (clearLines.length === 0) {
        return false;
    }

    return clearLines;
}

export function isOver(matrix) { // 游戏是否结束, 第一行落下方块为依据
    return matrix.get(0).some(n => !!n);
}

export function subscribeRecord(store) { // 将状态记录到 localStorage
    store.subscribe(() => {
        let data = store.getState().toJS();

        data.peerConnection = null; // no need to preserve on a already closed connection
        if (data.lock) { // 当状态为锁定, 不记录
            return;
        }

        data = JSON.stringify(data);
        data = encodeURIComponent(data);
        if (window.btoa) {
            data = btoa(data);
        }

        localStorage.setItem(StorageKey, data);
    });
}

export function subscribeTile(store) { // 将状态记录到 localStorage
    store.subscribe(() => {
        let data = store.getState().toJS();

        data.peerConnection = null;
        if (data.lock) {
            return;
        }

        data = JSON.stringify(data);
        data = encodeURIComponent(data);
        if (window.btoa) {
            data = btoa(data);
        }

        localStorage.setItem(StorageHold, data);
    });
}

export function senddata(conn, data) {
    if (conn) {
        for (let i = 0; i < conn.length; i++) {
            // later should a sequence number to reorder packet by us
            if (conn[i] !== undefined) {
                conn[i].send(JSON.stringify(data));
            }
        }
    }
}

export function isMobile() { // 判断是否为移动端
    const ua = navigator.userAgent;
    const android = /Android (\d+\.\d+)/.test(ua);
    const iphone = ua.indexOf('iPhone') > -1;
    const ipod = ua.indexOf('iPod') > -1;
    const ipad = ua.indexOf('iPad') > -1;
    const nokiaN = ua.indexOf('NokiaN') > -1;

    return android || iphone || ipod || ipad || nokiaN;
}

export {
    visibilityChangeEvent,
    isFocus,
};
