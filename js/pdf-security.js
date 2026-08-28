// PDF security engine (browser-only)
// Uses qpdf-run from jsDelivr. Kept separate so Protect/Unlock pages can lazy-load it.
import { createQpdfRunner } from 'https://cdn.jsdelivr.net/npm/qpdf-run@0.2.3/src/index.js';

let runnerPromise;

async function getRunner() {
  if (!runnerPromise) {
    runnerPromise = createQpdfRunner({
      assetBaseUrl: 'https://cdn.jsdelivr.net/npm/qpdf-run@0.2.3/vendor/qpdf/',
      timeoutMs: 120000
    });
  }
  return runnerPromise;
}

function passwordValue(value) {
  return String(value ?? '');
}

export async function protectPdf(file, password) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('Please choose a PDF file.');
  const pwd = passwordValue(password);
  if (!pwd) throw new Error('Please enter a password.');

  const qpdf = await getRunner();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const owner = (globalThis.crypto && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

  return qpdf.runOne({
    input: bytes,
    inputName: 'input.pdf',
    outputName: 'output.pdf',
    args: [
      '--encrypt', pwd, owner, '256',
      '--print=full', '--modify=none', '--extract=n', '--annotate=n',
      '--form=n', '--assemble=n', '--', 'input.pdf', 'output.pdf'
    ]
  });
}

export async function unlockPdf(file, password) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('Please choose a PDF file.');
  const qpdf = await getRunner();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pwd = passwordValue(password);

  return qpdf.runOne({
    input: bytes,
    inputName: 'input.pdf',
    outputName: 'output.pdf',
    args: [`--password=${pwd}`, '--decrypt', 'input.pdf', 'output.pdf']
  });
}
