import fs from 'fs';
import path from 'path';

export async function download(url: string, destination: string) {
  const dir = path.dirname(destination);

  if (!(await fs.promises.stat(dir)).isDirectory()) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  try {
    const res = await fetch(url)
    const bytes = await res.arrayBuffer();
    await fs.promises.writeFile(destination, Buffer.from(bytes));
    return true;
  } catch (e) {
    return e;
  }
}
