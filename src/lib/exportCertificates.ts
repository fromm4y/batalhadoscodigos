/**
 * Exportar certificados (SPEC-02 E): PNG de uma dupla e PDF da turma inteira (A4 deitado, uma
 * página por dupla). As bibliotecas só carregam quando alguém clica (não pesam no jogo).
 */
const PIXEL_RATIO = 2;
const A4 = { w: 297, h: 210 }; // mm, paisagem

async function toPng(node: HTMLElement): Promise<string> {
  const { toPng: render } = await import('html-to-image');
  // a cópia sai sem a margem de centralização da tela (senão a imagem fica deslocada e cortada)
  const opts = {
    cacheBust: true,
    backgroundColor: '#f6efdc',
    width: node.offsetWidth,
    height: node.offsetHeight,
    style: { margin: '0', transform: 'none' },
  };
  // renderiza duas vezes: a primeira carrega fontes e imagens no clone (bug conhecido do Chrome)
  await render(node, { ...opts, pixelRatio: 1 }).catch(() => undefined);
  return render(node, { ...opts, pixelRatio: PIXEL_RATIO });
}

function download(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Nome de arquivo seguro (sem acento nem espaço). */
export function fileSafe(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export async function downloadPng(node: HTMLElement, filename: string): Promise<void> {
  download(await toPng(node), filename);
}

export async function downloadPdf(nodes: HTMLElement[], filename: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  for (const [i, node] of nodes.entries()) {
    const img = await toPng(node);
    if (i > 0) pdf.addPage('a4', 'landscape');
    pdf.addImage(img, 'PNG', 0, 0, A4.w, A4.h);
  }
  pdf.save(filename);
}
