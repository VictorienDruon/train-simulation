interface GoWasm {
  importObject: WebAssembly.Imports;
  run(instance: WebAssembly.Instance): Promise<void>;
}

interface Window {
  Go: new () => GoWasm;
  Start: (driverBehavior: string, stationStrategy: string) => string;
  Tick: () => string;
}
