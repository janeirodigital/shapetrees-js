import { Quad } from 'rdf-data-factory';
import { Store, DefaultGraph, NamedNode } from 'n3';

interface ExecutionResult {
    deletions: Quad[];
    insertions: Quad[];
}

type Bindings = object;
type BindingsList = Bindings[];

export class N3Sparql {
    constructor(queryString: string, options: object);
    executeQuery(db: Store, initialBindings?: BindingsList, initialGraph?: DefaultGraph | NamedNode): ExecutionResult;
}

