// Browser-only PDF Protect / Unlock engine.
// qpdf-run 0.2.1 is the published browser build used here.
import { createQpdfRunner } from 'https://cdn.jsdelivr.net/npm/qpdf-run@0.2.1/src/index.js';

const QPDF_BASE = 'https://cdn.jsdelivr.net/npm/qpdf-run@0.2.1/vendor/qpdf/';
let runnerPromise = null;

function getRunner() {
  if (!runnerPromise) {
    runnerPromise = createQpdfRunner({
      assetBaseUrl: QPDF_BASE,
      timeoutMs: 120000,
      env: 'browser'
    });
  }
  return runnerPromise;
}

export async function protectPdf(file, password) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new Error('Please choose a PDF file.');
  }
  if (!password) throw new Error('Please enter a password.');

  const qpdf = await getRunner();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const owner = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

  return qpdf.runOne({
    input: bytes,
    inputName: 'input.pdf',
    outputName: 'output.pdf',
    args: [
      '--encrypt', String(password), owner, '256',
      '--print=full',
      '--modify=none',
      '--extract=n',
      '--annotate=n',
      '--form=n',
      '--assemble=n',
      '--', 'input.pdf', 'output.pdf'
    ]
  });
}

export async function unlockPdf(file, password) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new Error('Please choose a PDF file.');
  }
  if (!password) throw new Error('Please enter the PDF password.');

  const qpdf = await getRunner();
  const bytes = new Uint8Array(await file.arrayBuffer());

  return qpdf.runOne({
    input: bytes,
    inputName: 'input.pdf',
    outputName: 'output.pdf',
    args: [`--password=${String(password)}`, '--decrypt', '--', 'input.pdf', 'output.pdf']
  });
}
