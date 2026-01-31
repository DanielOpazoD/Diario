const createFallbackUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.random() * 16;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return Math.floor(value).toString(16);
  });

const createUUIDv4FromCrypto = (getRandomValues: (array: Uint8Array) => Uint8Array) => {
  return () => {
    const bytes = new Uint8Array(16);
    getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const toHex = (value: number) => value.toString(16).padStart(2, '0');
    return (
      toHex(bytes[0]) +
      toHex(bytes[1]) +
      toHex(bytes[2]) +
      toHex(bytes[3]) +
      '-' +
      toHex(bytes[4]) +
      toHex(bytes[5]) +
      '-' +
      toHex(bytes[6]) +
      toHex(bytes[7]) +
      '-' +
      toHex(bytes[8]) +
      toHex(bytes[9]) +
      '-' +
      toHex(bytes[10]) +
      toHex(bytes[11]) +
      toHex(bytes[12]) +
      toHex(bytes[13]) +
      toHex(bytes[14]) +
      toHex(bytes[15])
    );
  };
};

(() => {
  const globalCrypto = (globalThis as typeof globalThis & { crypto?: Crypto }).crypto;
  if (typeof (globalCrypto as Crypto | undefined)?.randomUUID === 'function') return;

  const getRandomValues = globalCrypto?.getRandomValues?.bind(globalCrypto);
  const randomUUID = (getRandomValues ? createUUIDv4FromCrypto(getRandomValues) : createFallbackUUID) as Crypto['randomUUID'];

  if (!globalCrypto) {
    (globalThis as typeof globalThis & { crypto: Crypto }).crypto = { randomUUID } as Crypto;
  } else {
    (globalCrypto as Crypto).randomUUID = randomUUID;
  }
})();
