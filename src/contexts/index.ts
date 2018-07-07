import { ISignal } from '@phosphor/signaling';

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

export * from './mux';
