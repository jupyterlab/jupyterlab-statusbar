import { IContext } from './index';
import { ContextMultiplexer } from './mux';
import { IDisposable } from '@phosphor/disposable';
import { ISignal, Signal } from '@phosphor/signaling';
import { SetExt } from '../util/set';

export class ContextManager implements IDisposable {
    constructor() {
        this._mux.changed.connect(this.onContextChange);
    }

    onContextChange = (
        mux: ContextMultiplexer,
        change: ContextMultiplexer.IChangedArgs
    ) => {
        let itemsBecameActive = new Array();
        let itemsBecameInactive = new Array();

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
        }

        if (itemsBecameInactive.length > 0) {
            this._itemsChanged.emit({
                newState: 'inactive',
                items: itemsBecameInactive
            });
        }
    };

    get itemsChanged(): ISignal<this, ContextManager.IChangedArgs> {
        return this._itemsChanged;
    }

    addItem(item: ContextManager.IItem) {
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
        ContextManager.IChangedArgs
    > = new Signal(this);

    private _activeContexts: Set<string> = new Set();

    private _allItems: Map<string, [IContext.State, Set<string>]> = new Map();
}

export namespace ContextManager {
    export interface IItem {
        name: string;
        contexts: string[];
    }

    export interface IChangedArgs {
        newState: IContext.State;
        items: string[];
    }
}
