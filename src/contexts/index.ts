import { ISignal } from '@phosphor/signaling';
import { JupyterLabPlugin, JupyterLab } from '@jupyterlab/application';
import { GlobalContext } from './global';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IContextManager, ContextManager } from './manager';
import { IDisposable } from '@phosphor/disposable';
import { ConsolePanel } from '@jupyterlab/console';
import { Terminal } from '@jupyterlab/terminal';
import { MainAreaContext } from './mainAreaContext';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { MainAreaWidget } from '@jupyterlab/apputils';

/**
 * The IContext interface represents meta-states of jupyterlab, such as having an active notebook, console, text editor,
 * file browser, etc. Each context will have a signal that fires whenever the context becomes active or goes
 * inactive.
 *
 * Context are solely for the purpose of signalling when something has gone out of scope or become inactive.
 * The contexts will not manage which is the current active document, or when some state changes internally. Details
 * such as that are left to each status item to implement.
 */

export interface IContext extends IDisposable {
    readonly name: string;
    readonly currentState: IContext.State;
    readonly stateChanged: ISignal<this, IContext.IChangedArgs>;

    refresh(): void;
}

export namespace IContext {
    export type State = 'active' | 'inactive';

    export interface IChangedArgs {
        newState: State;
    }
}

export namespace DefaultContexts {
    export const notebook = 'notebook';
    export const console = 'console';
    export const document = 'document';
    export const terminal = 'terminal';
    export const global = 'global';
}

export const contextManager: JupyterLabPlugin<IContextManager> = {
    id: 'jupyterlab-statusbar:contexts-manager',
    provides: IContextManager,
    activate: (app: JupyterLab) => {
        let defaultContexts = [
            new GlobalContext(),
            new MainAreaContext({
                shell: app.shell,
                name: DefaultContexts.notebook,
                isWidget: x => x instanceof NotebookPanel
            }),
            new MainAreaContext({
                shell: app.shell,
                name: DefaultContexts.console,
                isWidget: x => x instanceof ConsolePanel
            }),
            new MainAreaContext({
                shell: app.shell,
                name: DefaultContexts.terminal,
                isWidget: x =>
                    x instanceof MainAreaWidget &&
                    (x as MainAreaWidget).content instanceof Terminal
            }),
            new MainAreaContext({
                shell: app.shell,
                name: DefaultContexts.document,
                isWidget: x => x instanceof DocumentWidget
            })
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
export * from './global';
export * from './mainAreaContext';
