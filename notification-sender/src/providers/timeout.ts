/** Rejects with the error built by `onTimeout` when `promise` does not settle within `ms`. */
export const withTimeout = <T>(promise: Promise<T>, ms: number, onTimeout: () => Error): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(onTimeout()), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};
