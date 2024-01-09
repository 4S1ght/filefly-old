
type Proc       <V, E extends Error | string = Error> = [E, null] | [null, V]
type ProcAsync  <V, E extends Error | string = Error> = Promise<[E, null] | [null, V]>

type SProc      <E extends Error | string = Error> =    E | void
type SProcAsync <E extends Error | string = Error> =    Promise<E | void>