type InputContext = {
  typing?: boolean;
  composing?: boolean;
  modified?: boolean;
  repeat?: boolean;
};
const directions: Record<string, [number, number]> = {
  w: [0, -1],
  arrowup: [0, -1],
  s: [0, 1],
  arrowdown: [0, 1],
  a: [-1, 0],
  arrowleft: [-1, 0],
  d: [1, 0],
  arrowright: [1, 0],
};

export function createWorldInput() {
  const keys = new Set<string>();
  let tap: string | null = null;
  let enabled = true;
  const clear = () => {
    keys.clear();
    tap = null;
  };
  return {
    clear,
    enable(next: boolean) {
      enabled = next;
      clear();
    },
    down(raw: string, context: InputContext = {}): "move" | "interact" | null {
      if (!enabled || context.typing || context.composing || context.modified)
        return null;
      const key = raw.toLowerCase();
      if (key === "e" && !context.repeat) {
        clear();
        return "interact";
      }
      if (!directions[key]) return null;
      if (!keys.has(key)) tap = key;
      keys.add(key);
      return "move";
    },
    up(key: string) {
      keys.delete(key.toLowerCase());
    },
    read() {
      const buffered = keys.size === 0 && tap !== null;
      const active = buffered ? [tap!] : [...keys];
      tap = null;
      let dx = 0,
        dy = 0;
      for (const key of active) {
        dx += directions[key][0];
        dy += directions[key][1];
      }
      return { dx: Math.sign(dx), dy: Math.sign(dy), buffered };
    },
  };
}
