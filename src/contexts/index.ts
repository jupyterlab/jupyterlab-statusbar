import { ISignal } from '@phosphor/signaling';
import { JupyterLabPlugin, JupyterLab } from '@jupyterlab/application';
import { GlobalContext } from './global';
import { NotebookContext } from './notebook';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IContextManager, ContextManager } from './manager';

/**
 * The IContext interface represents meta-states of jupyterlab, such as having an active notebook, console, text editor,
 * file browser, etc. Each context will have a signal that fires whenever the context becomes active or goes
 * inactive.
 *
 * Context are solely for the purpose of signalling when something has gone out of scope or become inactive.
 * The contexts will not manage which is the current active document, or when some state changes internally. Details
 * such as that are left to each status item to implement.
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

export const contextManager: JupyterLabPlugin<IContextManager> = {
    id: 'jupyterlab-statusbar:contexts-manager',
    provides: IContextManager,
    requires: [INotebookTracker],
    activate: (_app: JupyterLab, tracker: INotebookTracker) => {
        let defaultContexts = [
            new GlobalContext(),
            new NotebookContext({ tracker })
        ];
        let manager = new ContextManager();

        for (let context of defaultContexts) {
            manager.addContext(context);
        }

        return manager;
    }
};

export * from './mux';
export * from './manager';
export * from './notebook';
export * from './global';
