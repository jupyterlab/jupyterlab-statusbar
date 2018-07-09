import { IContext } from './index';
import { ContextMultiplexer } from './mux';
import { IDisposable } from '@phosphor/disposable';
import { ISignal, Signal } from '@phosphor/signaling';
import { SetExt } from '../util/set';
import { Token } from '@phosphor/coreutils';

// tslint:disable-next-line:variable-name
export const IContextManager = new Token(
    'jupyterlab-statusbar/IContextManager'
);

export interface IContextManager {
    addItem(item: IContextManager.IItem): void;
    hasContext(context: string): boolean;
    addContext(context: IContext): void;

    readonly itemsChanged: ISignal<this, IContextManager.IChangedArgs>;
}

export namespace IContextManager {
    export interface IItem {
        name: string;
        contexts: string[];
    }

    export interface IChangedArgs {
        newState: IContext.State;
        items: string[];
    }
}

export class ContextManager implements IDisposable, IContextManager {
    constructor() {
        this._mux.changed.connect(this.onContextChange);
    }

    onContextChange = (
        mux: ContextMultiplexer,
        change: ContextMultiplexer.IChangedArgs
    ) => {
        let itemsBecameActive = new Array<string>();
        let itemsBecameInactive = new Array<string>();

        if (change.changeArgs.newState === 'active') {
            this._activeContexts.add(change.context);
        } else {
            this._activeContexts.delete(change.context);
        }

        for (let itemData of this._allItems) {
            const [itemId, [currentState, itemContexts]] = itemData;

            let itemActiveContexts = SetExt.intersection(
                itemContexts,
                this._activeContexts
            );

            if (currentState === 'active' && itemActiveContexts.size === 0) {
                itemsBecameInactive.push(itemId);
            } else if (
                currentState === 'inactive' &&
                itemActiveContexts.size > 0
            ) {
                itemsBecameActive.push(itemId);
            }
        }

        if (itemsBecameActive.length > 0) {
            this._itemsChanged.emit({
                items: itemsBecameActive,
                newState: 'active'
            });

            itemsBecameActive.forEach(itemId => {
                const itemData = this._allItems.get(itemId)!;

                this._allItems.set(itemId, ['active', itemData[1]]);
            });
        }

        if (itemsBecameInactive.length > 0) {
            this._itemsChanged.emit({
                newState: 'inactive',
                items: itemsBecameInactive
            });

            itemsBecameInactive.forEach(itemId => {
                const itemData = this._allItems.get(itemId)!;

                this._allItems.set(itemId, ['inactive', itemData[1]]);
            });
        }
    };

    get itemsChanged(): ISignal<this, IContextManager.IChangedArgs> {
        return this._itemsChanged;
    }

    addItem(item: IContextManager.IItem) {
        const { name, contexts } = item;

        let activeContexts = SetExt.intersection(
            this._activeContexts,
            new Set(contexts)
        );

        let newState: IContext.State;
        if (activeContexts.size === 0) {
            newState = 'inactive';
        } else {
            newState = 'active';
        }

        this._allItems.set(name, [newState, new Set(contexts)]);
    }

    addContext(context: IContext) {
        this._mux.addContext(context);

        if (context.currentState === 'active') {
            this._activeContexts.add(context.name);
        }
    }

    hasContext(context: string): boolean {
        return this._mux.hasContext(context);
    }

    get isDisposed() {
        return this._isDisposed;
    }

    dispose() {
        if (this._isDisposed) {
            return;
        }

        this._mux.dispose();
    }

    private _isDisposed: boolean = false;
    private _mux: ContextMultiplexer = new ContextMultiplexer();
    private _itemsChanged: Signal<
        this,
        IContextManager.IChangedArgs
    > = new Signal(this);

    private _activeContexts: Set<string> = new Set();

    private _allItems: Map<string, [IContext.State, Set<string>]> = new Map();
}
