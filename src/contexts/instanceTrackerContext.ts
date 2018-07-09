import { IContext } from '.';
import { IInstanceTracker } from '@jupyterlab/apputils';
import { Widget } from '@phosphor/widgets';
import { ISignal, Signal } from '@phosphor/signaling';

export class InstanceTrackerContext<
    W extends Widget,
    Tracker extends IInstanceTracker<W>
> implements IContext {
    constructor(opts: InstanceTrackerContext.IOptions<Tracker>) {
        this._tracker = opts.tracker;
        this._name = opts.name;

        this._currentState =
            this._tracker.currentWidget === null ? 'inactive' : 'active';
        this._tracker.currentChanged.connect(this.onTrackedWidgetChange);
    }

    get name(): string {
        return this._name;
    }

    get tracker(): Tracker {
        return this._tracker;
    }

    get currentState(): IContext.State {
        return this._currentState;
    }

    get stateChanged(): ISignal<this, IContext.IChangedArgs> {
        return this._stateChanged;
    }

    onTrackedWidgetChange = (tracker: Tracker, widget: W | null) => {
        if (widget === null && this._currentState === 'active') {
            this._currentState = 'inactive';
            this._stateChanged.emit({
                newState: 'inactive'
            });
        } else if (widget !== null && this._currentState === 'inactive') {
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

    private _name: string;
    private _tracker: Tracker;

    private _isDisposed: boolean = false;
    private _stateChanged: Signal<this, IContext.IChangedArgs> = new Signal(
        this
    );
    private _currentState: IContext.State = 'inactive';
}

export namespace InstanceTrackerContext {
    export interface IOptions<Tracker> {
        tracker: Tracker;
        name: string;
    }
}
