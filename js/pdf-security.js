import { createQpdfRunner } from 'https://cdn.jsdelivr.net/npm/qpdf-run@0.2.3/src/index.js';

let runnerPromise;
export async function getPdfSecurityRunner() {
  if (!runnerPromise) {
    runnerPromise = createQpdfRunner({
      assetBaseUrl: 'https://cdn.jsdelivr.net/npm/qpdf-run@0.2.3/vendor/qpdf/',
      timeoutMs: 120000
    });
  }
  return runnerPromise;
}

export async function protectPdf(file, password) {
  const qpdf = await getPdfSecurityRunner();
  const owner = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return qpdf.runOne({
    input: new Uint8Array(await file.arrayBuffer()),
    inputName: 'input.pdf',
    outputName: 'output.pdf',
    args: ['--encrypt', password, owner, '256', '--print=full', '--modify=none', '--extract=n', '--annotate=n', '--form=n', '--assemble=n', '--', 'input.pdf', 'output.pdf']
  });
}

export async function unlockPdf(file, password) {
  const qpdf = await getPdfSecurityRunner();
  return qpdf.runOne({
    input: new Uint8Array(await file.arrayBuffer()),
    inputName: 'input.pdf',
    outputName: 'output.pdf',
    args: [`--password=${password}`, '--decrypt', 'input.pdf', 'output.pdf']
  });
}
