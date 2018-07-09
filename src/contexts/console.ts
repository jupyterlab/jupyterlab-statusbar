import { IContext } from '.';
import { ISignal, Signal } from '@phosphor/signaling';
import { IConsoleTracker, ConsolePanel } from '@jupyterlab/console';

export class ConsoleContext implements IContext {
    constructor(opts: ConsoleContext.IOptions) {
        this._tracker = opts.tracker;

        this._currentState =
            this._tracker.currentWidget === null ? 'inactive' : 'active';
        this._tracker.currentChanged.connect(this.onActiveConsoleChange);
    }

    get name(): string {
        return 'console';
    }

    get currentState(): IContext.State {
        return this._currentState;
    }

    get stateChanged(): ISignal<this, IContext.IChangedArgs> {
        return this._stateChanged;
    }

    onActiveConsoleChange = (
        tracker: IConsoleTracker,
        panel: ConsolePanel | null
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
    private _tracker: IConsoleTracker;
    private _currentState: IContext.State = 'inactive';
}

export namespace ConsoleContext {
    export interface IOptions {
        tracker: IConsoleTracker;
    }
}
