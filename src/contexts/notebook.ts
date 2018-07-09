import { IContext } from '.';
import { ISignal, Signal } from '@phosphor/signaling';
import { IDisposable } from '@phosphor/disposable';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

export class NotebookContext implements IContext, IDisposable {
    constructor(opts: NotebookContext.IOptions) {
        this._tracker = opts.tracker;

        this._tracker.currentChanged.connect(this.onActiveNotebookChange);
    }

    get name(): string {
        return 'notebook';
    }

    get currentState(): IContext.State {
        return this._currentState;
    }

    get stateChanged(): ISignal<this, IContext.IChangedArgs> {
        return this._stateChanged;
    }

    onActiveNotebookChange = (
        tracker: INotebookTracker,
        panel: NotebookPanel | null
    ) => {
        if (panel === null && this._currentState === 'active') {
            this._currentState = 'inactive';
            this._stateChanged.emit({
                newState: 'inactive'
            });
        } else if (panel !== null && this._currentState === 'inactive') {
            this._currentState = 'active';
            this._stateChanged.emit({
                newState: 'active'
            });
        }
    };

    dispose() {
        if (this._isDisposed) {
            return;
        }

        this._tracker.dispose();
        this._isDisposed = true;
    }

    get isDisposed(): boolean {
        return this._isDisposed;
    }

    private _isDisposed: boolean = false;
    private _stateChanged: Signal<this, IContext.IChangedArgs> = new Signal(
        this
    );
    private _tracker: INotebookTracker;
    private _currentState: IContext.State = 'inactive';
}

export namespace NotebookContext {
    export interface IOptions {
        tracker: INotebookTracker;
    }
}
