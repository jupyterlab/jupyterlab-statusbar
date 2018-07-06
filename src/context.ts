import { ISignal, Signal } from '@phosphor/signaling';
import { IDisposable } from '@phosphor/disposable';

/**
 * The IContext interface represents meta-states of jupyterlab, such as having an active notebook, console, text editor,
 * file browser, etc. Each context will have a signal that fires whenever the context becomes active or goes
 * inactive.
 */
export interface IContext {
    readonly name: string;
    readonly currentState: IContext.State;
    readonly stateChanged: ISignal<this, IContext.IChangedArgs>;
}

export namespace IContext {
    export type State = 'active' | 'inactive';

    export interface IChangedArgs {
        newState: State;
    }
}

export class ContextMultiplexer implements IDisposable {
    addContext(context: IContext): boolean {
        let hadPrev = this._contexts.has(context.name);
        this._contexts.set(context.name, context);

        context.stateChanged.connect(this.onStateChanged);

        return hadPrev;
    }

    onStateChanged = (
        context: IContext,
        stateChange: IContext.IChangedArgs
    ) => {
        this._multiplexer.emit({
            context: context.name,
            newState: stateChange.newState
        });
    };

    get changed() {
        return this._multiplexer;
    }

    dispose() {
        if (!this._isDisposed) {
            this._contexts.forEach((context: IContext, key: string) => {
                context.stateChanged.disconnect(this.onStateChanged);
            });

            Signal.clearData(this);

            this._isDisposed = true;
        }
    }

    get isDisposed() {
        return this._isDisposed;
    }

    private _isDisposed = false;
    private _contexts: Map<string, IContext> = new Map();
    private _multiplexer: Signal<
        this,
        ContextMultiplexer.IChangedArgs
    > = new Signal(this);
}

export namespace ContextMultiplexer {
    export interface IChangedArgs {
        context: string;
        newState: IContext.State;
    }
}
