// Browser-only PDF Protect / Unlock engine.
// qpdf-run 0.2.1 with explicit worker/WASM URLs for static hosting and mobile browsers.
const QPDF_BASE = 'https://cdn.jsdelivr.net/npm/qpdf-run@0.2.1';
let runnerPromise = null;

async function getRunner() {
  if (!runnerPromise) {
    const { createQpdfRunner } = await import(`${QPDF_BASE}/src/index.js`);
    runnerPromise = createQpdfRunner({
      env: 'browser',
      workerUrl: `${QPDF_BASE}/src/worker.js`,
      qpdfJsUrl: `${QPDF_BASE}/vendor/qpdf/lib/qpdf.js`,
      wasmUrl: `${QPDF_BASE}/vendor/qpdf/lib/qpdf.wasm`,
      timeoutMs: 180000
    });
  }
  return runnerPromise;
}

async function readPdf(file) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('Please choose a PDF file.');
  if (!file.size) throw new Error('The selected PDF is empty.');
  return new Uint8Array(await file.arrayBuffer());
}

export async function protectPdf(file, password) {
  const pwd = String(password ?? '');
  if (!pwd) throw new Error('Please enter a password.');
  const qpdf = await getRunner();
  const bytes = await readPdf(file);
  const result = await qpdf.run({
    inputs: { 'input.pdf': bytes },
    args: ['--encrypt', pwd, pwd, '256', '--print=full', '--modify=none', '--extract=n', '--annotate=n', '--form=n', '--assemble=n', '--', 'input.pdf', 'output.pdf'],
    outputs: ['output.pdf']
  });
  if (!result.ok || !result.outputs['output.pdf']) throw new Error((result.stderr || []).join(' ') || 'qpdf did not produce a protected PDF.');
  return result.outputs['output.pdf'];
}

export async function unlockPdf(file, password) {
  const pwd = String(password ?? '');
  if (!pwd) throw new Error('Please enter the PDF password.');
  const qpdf = await getRunner();
  const bytes = await readPdf(file);
  const result = await qpdf.run({
    inputs: { 'input.pdf': bytes },
    args: [`--password=${pwd}`, '--decrypt', '--', 'input.pdf', 'output.pdf'],
    outputs: ['output.pdf']
  });
  if (!result.ok || !result.outputs['output.pdf']) throw new Error((result.stderr || result.warnings || []).join(' ') || 'Could not unlock the PDF. Check the password.');
  return result.outputs['output.pdf'];
}
