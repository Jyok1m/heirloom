import type { Response } from 'express';

// Known raster images are safe to render inline; anything else the client may
// have uploaded (SVG, HTML, PDF…) is forced to download, so a hostile file
// cannot execute script on our origin when its URL is opened directly. nosniff
// stops the browser from re-interpreting the declared content type.
const INLINE_SAFE = /^image\/(png|jpe?g|gif|webp|avif)$/i;

export function setMediaServeHeaders(res: Response, mimeType: string): void {
  res.setHeader('Content-Type', mimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader(
    'Content-Disposition',
    INLINE_SAFE.test(mimeType) ? 'inline' : 'attachment',
  );
}
