import { IContext } from './index';
import { ISignal, Signal } from '@phosphor/signaling';

export class GlobalContext implements IContext {
    get name(): string {
        return 'global';
    }

    get currentState(): IContext.State {
        return this._currentState;
    }

    get stateChanged(): ISignal<this, IContext.IChangedArgs> {
        return this._dummySignal;
    }

    get isDisposed(): boolean {
        return this._isDisposed;
    }

    dispose() {
        if (this._isDisposed) {
            return;
        }

        Signal.clearData(this);
        this._isDisposed = true;
    }

    private _isDisposed: boolean = false;
    private _currentState: IContext.State = 'active';
    private _dummySignal: Signal<this, IContext.IChangedArgs> = new Signal(
        this
    );
}
