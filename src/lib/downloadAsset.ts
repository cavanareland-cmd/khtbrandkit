/** Helpers untuk mengunduh aset brand kit (bekerja juga di host statis seperti Vercel). */

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-") || "asset";

const triggerBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

export const assetFilename = (name: string, ext: string) => `${slug(name)}.${ext}`;

/** Unduh file dari URL sebagai blob supaya atribut `download` tetap dihormati lintas origin. */
export async function downloadFromUrl(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    triggerBlob(await res.blob(), filename);
  } catch {
    // Fallback: biarkan browser yang menangani (tab baru).
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

/** Serialize elemen <svg> yang sedang tampil menjadi file .svg. */
export function downloadSvgElement(svg: SVGSVGElement | null, filename: string): boolean {
  if (!svg) return false;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", "0 0 24 24");
  clone.setAttribute("width", "128");
  clone.setAttribute("height", "128");
  clone.removeAttribute("class");
  const source = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
  triggerBlob(new Blob([source], { type: "image/svg+xml;charset=utf-8" }), filename);
  return true;
}

/** Bungkus gambar raster (PNG/JPG) menjadi file SVG vector-container. */
export async function downloadRasterAsSvg(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024" width="1024" height="1024">
  <image href="${dataUrl}" xlink:href="${dataUrl}" x="0" y="0" width="1024" height="1024" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
    triggerBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), filename);
  } catch {
    await downloadFromUrl(url, filename.replace(/\.svg$/, ".png"));
  }
}
