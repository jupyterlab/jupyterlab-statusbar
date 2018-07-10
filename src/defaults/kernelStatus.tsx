import * as ReactDOM from 'react-dom';
import * as React from 'react';

import { JupyterLabPlugin, JupyterLab } from '@jupyterlab/application';

import { INotebookTracker } from '@jupyterlab/notebook';

import { IDefaultStatusesManager } from './manager';

import { Widget } from '@phosphor/widgets';
import { DefaultContexts } from '../contexts';

export namespace StatusComponent {
    export interface IState {
        kernelStatus: string;
    }
    export interface IProps {
        tracker: INotebookTracker;
    }
}

export class StatusComponent extends React.Component<
    StatusComponent.IProps,
    StatusComponent.IState
> {
    state = {
        kernelStatus: ''
    };
    constructor(props: StatusComponent.IProps) {
        super(props);
        this.props.tracker.currentChanged.connect(this.cellChanged);
        this.props.tracker.activeCellChanged.connect(this.cellChanged);
    }

    cellChanged = () => {
        const currentWidget = this.props.tracker.currentWidget;
        if (currentWidget !== null && currentWidget.session.kernel) {
            this.setState({
                kernelStatus: currentWidget.session.kernel.status
            });
            currentWidget.session.statusChanged.connect(this.kernelChanged);
            currentWidget.session.kernelChanged.connect(this.kernelChanged);
        }
    };

    kernelChanged = () => {
        const currentWidget = this.props.tracker.currentWidget;
        if (currentWidget !== null && currentWidget.session.kernel) {
            this.setState({
                kernelStatus: currentWidget.session.kernel.status
            });
        } else {
            this.setState({ kernelStatus: 'dead' });
        }
    };

    render() {
        return <div> Kernel Status: {this.state.kernelStatus} </div>;
    }
}

export class KernelStatus extends Widget {
    constructor(opts: KernelStatus.IOptions) {
        super();
        this._tracker = opts.tracker;
    }
    onBeforeAttach() {
        ReactDOM.render(<StatusComponent tracker={this._tracker} />, this.node);
    }

    private _tracker: INotebookTracker;
}

/*
 * Initialization data for the statusbar extension.
 */

export const kernelStatusItem: JupyterLabPlugin<void> = {
    id: 'jupyterlab-statusbar/default-items:kernel-status',
    autoStart: true,
    requires: [IDefaultStatusesManager, INotebookTracker],
    activate: (
        app: JupyterLab,
        manager: IDefaultStatusesManager,
        tracker: INotebookTracker
    ) => {
        manager.addDefaultStatus(
            'kernel-status-item',
            new KernelStatus({ tracker }),
            {
                align: 'left',
                contexts: [DefaultContexts.notebook, DefaultContexts.console]
            }
        );
    }
};

export namespace KernelStatus {
    /**
     * Options for creating a new StatusBar instance
     */
    export interface IOptions {
        tracker: INotebookTracker;
    }
}
