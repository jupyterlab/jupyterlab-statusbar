import * as ReactDOM from 'react-dom';
import * as React from 'react';

import { JupyterLabPlugin, JupyterLab } from '@jupyterlab/application';

import { INotebookTracker } from '@jupyterlab/notebook';

import { Widget } from '@phosphor/widgets';

import { IDefaultStatusesManager } from './manager';
import { DefaultContexts } from '../contexts';

export namespace LineColComponent {
    export interface IState {
        line: number;
        col: number;
    }

    export interface IProps {
        tracker: INotebookTracker;
    }
}

export class LineColComponent extends React.Component<
    LineColComponent.IProps,
    LineColComponent.IState
> {
    state = {
        line: 0,
        col: 0
    };

    constructor(props: LineColComponent.IProps) {
        super(props);

        this.props.tracker.currentChanged.connect(this.cellChange);
        this.props.tracker.activeCellChanged.connect(this.cellChange);
        this.props.tracker.selectionChanged.connect(this.cellChange);
    }

    cellChange = (tracker: INotebookTracker) => {
        if (tracker.activeCell) {
            this.setState({
                col: tracker.activeCell.editor.getCursorPosition().column
            });
            this.setState({
                line: tracker.activeCell.editor.getCursorPosition().line
            });
            tracker.activeCell.editor.model.value.changed.connect(
                this.valueChanged
            );
            tracker.activeCell.editor.model.selections.changed.connect(
                this.valueChanged
            );
        }
    };

    valueChanged = () => {
        this.setState({
            col: this.props.tracker.activeCell.editor.getCursorPosition().column
        });
        this.setState({
            line: this.props.tracker.activeCell.editor.getCursorPosition().line
        });
    };

    render() {
        return (
            <div>
                Line:{this.state.line} Col:{this.state.col}
            </div>
        );
    }
}

export class LineCol extends Widget {
    constructor(opts: LineCol.IOptions) {
        super();
        this._tracker = opts.tracker;
    }

    onBeforeAttach() {
        ReactDOM.render(
            <LineColComponent tracker={this._tracker} />,
            this.node
        );
    }
    private _tracker: INotebookTracker;
}
export const lineColItem: JupyterLabPlugin<void> = {
    id: 'jupyterlab-statusbar/default-items:line-col',
    autoStart: true,
    requires: [IDefaultStatusesManager, INotebookTracker],
    activate: (
        app: JupyterLab,
        manager: IDefaultStatusesManager,
        tracker: INotebookTracker
    ) => {
        manager.addDefaultStatus('line-col-item', new LineCol({ tracker }), {
            align: 'left',
            contexts: [DefaultContexts.notebook, DefaultContexts.document]
        });
    }
};

export namespace LineCol {
    export interface IOptions {
        tracker: INotebookTracker;
    }
}
