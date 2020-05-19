import React from 'react';
import PropTypes from 'prop-types';

import styles from './index.less';

class PeerJsConfigForm extends React.PureComponent {
    static propTypes = {
        onSubmit: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.state = {
            host: 'localhost',
            port: 9000,
            path: '/cotetris',

            debug: 3, // Set highest debug level (log everything!).
        };
    }

    _handleConfigSubmit = (event) => {
        const {
            host,
            port,
            path,
            debug,
        } = this.state;

        this.props.onSubmit(event, host, port, path, debug);
    }

    _handleConfigChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;

        if (['host', 'path'].includes(name)) {
            this.setState({
                [name]: value,
            });
        }

        if (['port', 'debug'].includes(name)) {
            this.setState({
                [name]: parseInt(value),
            });
        }
    }

    render() {
        const {
            host,
            port,
            path,
            debug,
        } = this.state;

        return (
            <form className={styles.form} onSubmit={this._handleConfigSubmit}>
                PeerJs config:
                <div>
                    host:
                    <input
                        name="host"
                        type="text"
                        onChange={this._handleConfigChange}
                        value={host}
                    />
                </div>
                <div>
                    port:
                    <input
                        name="port"
                        type="text"
                        onChange={this._handleConfigChange}
                        value={port}
                    />
                </div>
                <div>
                    path:
                    <input
                        name="path"
                        type="text"
                        onChange={this._handleConfigChange}
                        value={path}
                    />
                </div>
                <div>
                    debug level:
                    <input
                        name="debug"
                        type="text"
                        onChange={this._handleConfigChange}
                        value={debug}
                    />
                </div>
                <input type="submit" value="Use config"/>
            </form>
        );
    }
}

export default PeerJsConfigForm;
