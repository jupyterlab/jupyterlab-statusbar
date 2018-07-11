import { Widget, Panel, PanelLayout } from '@phosphor/widgets';

import { Token } from '@phosphor/coreutils';

import { ApplicationShell } from '@jupyterlab/application';
import { ArrayExt, each } from '@phosphor/algorithm';
import { IDefaultStatusesManager } from './defaults';
import { IObservableSet } from './util/observableset';
import { IObservableMap } from '@jupyterlab/observables';
import { IContext, IContextManager } from './contexts';

// tslint:disable-next-line:variable-name
export const IStatusBar = new Token<IStatusBar>(
    'jupyterlab-statusbar/IStatusBar'
);

export interface IStatusBar {
    listItems(): string[];
    hasItem(id: string): boolean;

    registerStatusItem(
        id: string,
        widget: Widget,
        opts: IStatusBar.IItemOptions
    ): void;

    registerContext(context: IContext): void;
}

export namespace IStatusBar {
    export type Alignment = 'right' | 'left';

    export interface IItemOptions {
        align?: IStatusBar.Alignment;
        priority?: number;
        contexts: string[];
    }
}

const STATUS_BAR_ID = 'jp-main-status-bar';

const STATUS_BAR_CLASS = 'jp-status-bar';
const STATUS_BAR_SIDE_CLASS = 'jp-status-bar-side';
const STATUS_BAR_LEFT_SIDE_CLASS = 'jp-status-bar-left';
const STATUS_BAR_RIGHT_SIDE_CLASS = 'jp-status-bar-right';
const STATUS_BAR_ITEM_CLASS = 'jp-status-bar-item';

export class StatusBar extends Widget implements IStatusBar {
    constructor(options: StatusBar.IOptions) {
        super();

        this._host = options.host;
        this._defaultManager = options.defaultManager;
        this._contextManager = options.contextManager;

        this.id = STATUS_BAR_ID;
        this.addClass(STATUS_BAR_CLASS);

        let rootLayout = (this.layout = new PanelLayout());

        let leftPanel = (this._leftSide = new Panel());
        let rightPanel = (this._rightSide = new Panel());

        leftPanel.addClass(STATUS_BAR_SIDE_CLASS);
        leftPanel.addClass(STATUS_BAR_LEFT_SIDE_CLASS);

        rightPanel.addClass(STATUS_BAR_SIDE_CLASS);
        rightPanel.addClass(STATUS_BAR_RIGHT_SIDE_CLASS);

        rootLayout.addWidget(leftPanel);
        rootLayout.addWidget(rightPanel);

        this._host.addToBottomArea(this);

        this._defaultManager.enabledChanged.connect(
            this.onEnabledDefaultItemChange
        );
        this._defaultManager.itemAdded.connect(this.onDefaultItemAdd);
        this._defaultManager.allItems.forEach(elem => {
            const { id, item, opts } = elem;

            this.registerStatusItem(id, item, opts);
        });

        this._contextManager.itemsChanged.connect(this.onContextItemChange);
    }

    registerStatusItem(
        id: string,
        widget: Widget,
        opts: IStatusBar.IItemOptions = { contexts: [] }
    ) {
        if (id in this._statusItems) {
            throw new Error(`Status item ${id} already registered.`);
        }

        let align = opts.align ? opts.align : 'left';
        let priority = opts.priority !== undefined ? opts.priority : 0;

        let wrapper = {
            widget,
            align,
            priority
        };

        let rankItem = {
            id,
            priority
        };

        widget.addClass(STATUS_BAR_ITEM_CLASS);
        if (widget.id !== id) {
            widget.id = id; // TODO Should do this? Or nah?
        }

        this._statusItems[id] = wrapper;

        if (align === 'left') {
            let insertIndex = this._findInsertIndex(
                this._leftRankItems,
                rankItem
            );

            ArrayExt.insert(this._leftRankItems, insertIndex, rankItem);
            this._leftSide.insertWidget(insertIndex, widget);
        } else {
            let insertIndex = this._findInsertIndex(
                this._rightRankItems,
                rankItem
            );

            ArrayExt.insert(this._rightRankItems, insertIndex, rankItem);
            this._rightSide.insertWidget(insertIndex, widget);
        }

        this._contextManager.addItem({ name: id, contexts: opts.contexts });
    }

    registerContext(context: IContext): void {
        if (this._contextManager.hasContext(context.name)) {
            throw new Error(
                `Context ${context.name} has already been registered.`
            );
        }

        this._contextManager.addContext(context);
    }

    /**
     * List the ids of the status bar items;
     *
     * @returns A new array of the status bar item ids.
     */
    listItems(): string[] {
        return Object.keys(this._statusItems);
    }

    /**
     * Test whether a specific status item is present in the status bar.
     *
     * @param id The id of the status item of interest
     *
     * @returns `true` if the status item is in the status bar, `false` otherwise.
     */
    hasItem(id: string): boolean {
        return id in this._statusItems;
    }

    /**
     * Get the parent ApplicationShell
     */
    get host(): ApplicationShell {
        return this._host;
    }

    get defaultManager(): IDefaultStatusesManager {
        return this._defaultManager;
    }

    onEnabledDefaultItemChange = (
        _allEnabled: IObservableSet<IDefaultStatusesManager.IItem>,
        enableChange: IObservableSet.IChangedArgs<IDefaultStatusesManager.IItem>
    ) => {
        const changeType = enableChange.type;

        if (changeType === 'add') {
            each(enableChange.values, element => {
                this._statusItems[element.id].widget.show();
            });
        } else {
            each(enableChange.values, element => {
                this._statusItems[element.id].widget.hide();
            });
        }
    };

    onDefaultItemAdd = (
        _allDefaults: IObservableMap<IDefaultStatusesManager.IItem>,
        change: IObservableMap.IChangedArgs<IDefaultStatusesManager.IItem>
    ) => {
        if (change.newValue !== undefined) {
            const { id, item, opts } = change.newValue;

            this.registerStatusItem(id, item, opts);
        }
    };

    onContextItemChange = (
        _contextManager: IContextManager,
        change: IContextManager.IChangedArgs
    ) => {
        if (change.newState === 'active') {
            change.items.forEach(itemId => {
                this._statusItems[itemId].widget.show();
            });
        } else {
            change.items.forEach(itemId => {
                this._statusItems[itemId].widget.hide();
            });
        }
    };

    dispose() {
        super.dispose();

        this._contextManager.dispose();
    }

    private _findInsertIndex(
        side: StatusBar.IRankItem[],
        newItem: StatusBar.IRankItem
    ): number {
        return ArrayExt.findFirstIndex(
            side,
            item => item.priority > newItem.priority
        );
    }

    private _leftRankItems: StatusBar.IRankItem[] = [];
    private _rightRankItems: StatusBar.IRankItem[] = [];
    private _statusItems: { [id: string]: StatusBar.IItem } = Object.create(
        null
    );

    private _host: ApplicationShell;
    private _defaultManager: IDefaultStatusesManager;
    private _contextManager: IContextManager;

    private _leftSide: Panel;
    private _rightSide: Panel;
}

export namespace StatusBar {
    export interface IRankItem {
        id: string;
        priority: number;
    }

    /**
     * Options for creating a new StatusBar instance
     */
    export interface IOptions {
        host: ApplicationShell;
        defaultManager: IDefaultStatusesManager;
        contextManager: IContextManager;
    }

    export interface IItem {
        align: IStatusBar.Alignment;
        priority: number;
        widget: Widget;
    }
}
