import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { JupyterLabPlugin, JupyterLab } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { toArray } from '@phosphor/algorithm';
import { Widget } from '@phosphor/widgets';
import { IDefaultStatusesManager } from './manager';

export class NotebookTrustStatus extends React.Component<
    NotebookTrustStatus.IProps,
    NotebookTrustStatus.IState
> {
    state = {
        numTrustedCells: 0,
        numCells: 0,
        activeCellTrusted: false
    };

    constructor(props: NotebookTrustStatus.IProps) {
        super(props);

        this.props.tracker.currentChanged.connect(this.onDocumentChange);
        this.props.tracker.activeCellChanged.connect(this.onDocumentChange);
    }

    onDocumentChange = (tracker: INotebookTracker) => {
        if (tracker.currentWidget !== null) {
            let cells = toArray(tracker.currentWidget.model.cells);
            let numTrustedCells = cells.reduce((accum, current) => {
                if (current.trusted) {
                    return accum + 1;
                } else {
                    return accum;
                }
            }, 0);
            let numCells = cells.length;

            this.setState({
                numTrustedCells,
                numCells,
                activeCellTrusted: tracker.activeCell
                    ? tracker.activeCell.model.trusted
                    : false
            });
        } else {
            this.setState({
                numTrustedCells: 0,
                numCells: 0,
                activeCellTrusted: false
            });
        }
    };

    render() {
        return (
            <div>
                Trusting {this.state.numTrustedCells} of {this.state.numCells}{' '}
                cells. Current cell is{' '}
                {this.state.activeCellTrusted ? 'trusted' : 'not trusted'}.
            </div>
        );
    }
}

export namespace NotebookTrustStatus {
    export interface IState {
        numCells: number;
        numTrustedCells: number;
        activeCellTrusted: boolean;
    }

    export interface IProps {
        tracker: INotebookTracker;
    }
}

export class NotebookTrust extends Widget {
    constructor(opts: NotebookTrust.IOptions) {
        super();

        this._tracker = opts.tracker;
    }

    onBeforeAttach() {
        ReactDOM.render(
            <NotebookTrustStatus tracker={this._tracker} />,
            this.node
        );
    }

    private _tracker: INotebookTracker;
}

export namespace NotebookTrust {
    export interface IOptions {
        tracker: INotebookTracker;
    }
}

export const notebookTrustItem: JupyterLabPlugin<void> = {
    id: 'jupyterlab-statusbar/default-items:trusted-notebook',
    autoStart: true,
    requires: [IDefaultStatusesManager, INotebookTracker],
    activate: (
        _app: JupyterLab,
        manager: IDefaultStatusesManager,
        tracker: INotebookTracker
    ) => {
        manager.addDefaultStatus(
            'notebook-trust-item',
            new NotebookTrust({ tracker }),
            { contexts: ['notebook'] } // TODO add actual contexts for item
        );
    }
};
