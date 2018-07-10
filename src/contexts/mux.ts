import { Signal } from '@phosphor/signaling';
import { IDisposable } from '@phosphor/disposable';
import { IContext } from './index';

export class ContextMultiplexer implements IDisposable {
    addContext(context: IContext): boolean {
        let hadPrev = this._contexts.has(context.name);
        this._contexts.set(context.name, context);

        context.stateChanged.connect(this.onStateChanged);

        return hadPrev;
    }

    hasContext(name: string): boolean {
        return this._contexts.has(name);
    }

    getContext(name: string): IContext {
        let context = this._contexts.get(name);
        if (context !== undefined) {
            return context;
        } else {
            throw new Error(`Context ${name} is not in mux`);
        }
    }

    refresh() {
        this._contexts.forEach(context => {
            context.refresh();
        });
    }

    onStateChanged = (
        context: IContext,
        stateChange: IContext.IChangedArgs
    ) => {
        this._multiplexer.emit({
            context: context.name,
            changeArgs: stateChange
        });
    };

    get changed() {
        return this._multiplexer;
    }

    dispose() {
        if (!this._isDisposed) {
            this._contexts.forEach((context: IContext, key: string) => {
                context.stateChanged.disconnect(this.onStateChanged);

                context.dispose();
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
        changeArgs: IContext.IChangedArgs;
    }
}
