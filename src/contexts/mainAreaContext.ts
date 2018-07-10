import { IContext } from './index';
import { ApplicationShell } from '@jupyterlab/application';
import { Widget } from '@phosphor/widgets';
import { Signal } from '@phosphor/signaling';

export class MainAreaContext implements IContext {
    constructor(opts: MainAreaContext.IOptions) {
        this._name = opts.name;
        this._testFunc = opts.isWidget;
        this._shell = opts.shell;

        this._shell.currentChanged.connect(this.onCurrentChanged);

        this._stateChanged.connect((self, change) => {
            console.log(`${self.name} changed to ${change.newState}`);
        });
    }

    onCurrentChanged = (
        shell: ApplicationShell,
        change: ApplicationShell.IChangedArgs
    ) => {
        const oldMatch =
            change.oldValue !== null && this._testFunc(change.oldValue);
        const newMatch =
            change.newValue !== null && this._testFunc(change.newValue);

        if (oldMatch && !newMatch) {
            this._currentState = 'inactive';
            this._stateChanged.emit({
                newState: 'inactive'
            });
        } else if (!oldMatch && newMatch) {
            this._currentState = 'active';
            this._stateChanged.emit({
                newState: 'active'
            });
        }
    };

    get name() {
        return this._name;
    }

    get currentState() {
        return this._currentState;
    }

    get isDisposed() {
        return this._isDisposed;
    }

    get stateChanged() {
        return this._stateChanged;
    }

    dispose() {
        if (this.isDisposed) {
            return;
        }

        Signal.clearData(this);
        this._isDisposed = true;
    }

    refresh() {
        const currentWidget = this._shell.currentWidget;
        const prevState = this._currentState;
        if (currentWidget !== null) {
            if (this._testFunc(currentWidget)) {
                this._currentState = 'active';
            } else {
                this._currentState = 'inactive';
            }
        } else {
            this._currentState = 'inactive';
        }

        if (this._currentState !== prevState) {
            this._stateChanged.emit({
                newState: this._currentState
            });
        }
    }

    private _isDisposed: boolean = false;

    private _currentState: IContext.State;
    private _stateChanged: Signal<this, IContext.IChangedArgs> = new Signal(
        this
    );

    private _name: string;
    private _shell: ApplicationShell;
    private _testFunc: (x: any) => boolean;
}

export namespace MainAreaContext {
    export interface IOptions {
        shell: ApplicationShell;
        name: string;
        isWidget: (x: Widget) => boolean;
    }
}
