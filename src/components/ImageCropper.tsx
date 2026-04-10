"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface ImageCropperProps {
  src: string;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropper({ src: srcProp, onCrop, onCancel }: ImageCropperProps) {
  // リモートURLの場合fetchしてBlob URLに変換（CORS対策）
  const [src, setSrc] = useState(srcProp);
  useEffect(() => {
    if (srcProp.startsWith("blob:") || srcProp.startsWith("data:")) {
      setSrc(srcProp);
      return;
    }
    fetch(srcProp)
      .then((res) => res.blob())
      .then((blob) => setSrc(URL.createObjectURL(blob)))
      .catch(() => setSrc(srcProp));
  }, [srcProp]);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  const CROP_SIZE = 280;

  const onImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const { naturalWidth, naturalHeight } = img;
    // 短辺がCROP_SIZEに合うようにスケール
    const minScale = CROP_SIZE / Math.min(naturalWidth, naturalHeight);
    setScale(minScale);
    setImgSize({ w: naturalWidth, h: naturalHeight });
    // 中央寄せ
    setOffset({
      x: (CROP_SIZE - naturalWidth * minScale) / 2,
      y: (CROP_SIZE - naturalHeight * minScale) / 2,
    });
  }, []);

  // ドラッグ操作
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [offset]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      // 画像がクロップ枠からはみ出さないように制限
      const scaledW = imgSize.w * scale;
      const scaledH = imgSize.h * scale;
      const clampedX = Math.min(0, Math.max(CROP_SIZE - scaledW, newX));
      const clampedY = Math.min(0, Math.max(CROP_SIZE - scaledH, newY));
      setOffset({ x: clampedX, y: clampedY });
    },
    [dragging, dragStart, imgSize, scale]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  // ピンチズーム
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      setScale((prev) => {
        const minScale = CROP_SIZE / Math.min(imgSize.w || 1, imgSize.h || 1);
        const next = Math.max(minScale, Math.min(prev - e.deltaY * 0.001, minScale * 4));
        return next;
      });
    }
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [imgSize]);

  // スケール変更時にオフセットを再制限
  useEffect(() => {
    const scaledW = imgSize.w * scale;
    const scaledH = imgSize.h * scale;
    setOffset((prev) => ({
      x: Math.min(0, Math.max(CROP_SIZE - scaledW, prev.x)),
      y: Math.min(0, Math.max(CROP_SIZE - scaledH, prev.y)),
    }));
  }, [scale, imgSize]);

  const handleCrop = useCallback(async () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    // offset/scale → 元画像上の切り抜き座標に変換
    const sourceX = -offset.x / scale;
    const sourceY = -offset.y / scale;
    const sourceSize = CROP_SIZE / scale;
    ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 512, 512);
    canvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      "image/png",
      0.9
    );
  }, [offset, scale, onCrop]);

  const minScale = CROP_SIZE / Math.min(imgSize.w || 1, imgSize.h || 1);
  const maxScale = minScale * 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl">
        <p className="mb-4 text-center text-sm font-semibold">
          ドラッグで位置を調整
        </p>

        {/* クロップエリア */}
        <div
          ref={containerRef}
          className="relative mx-auto overflow-hidden rounded-2xl"
          style={{ width: CROP_SIZE, height: CROP_SIZE, touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <img
            ref={imgRef}
            src={src}
            alt=""
            onLoad={onImageLoad}
            className="pointer-events-none absolute select-none"
            style={{
              width: imgSize.w * scale,
              height: imgSize.h * scale,
              transform: `translate(${offset.x}px, ${offset.y}px)`,
              maxWidth: "none",
            }}
            draggable={false}
          />
          {/* 枠線 */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-white/50" />
        </div>

        {/* ズームスライダー */}
        {imgSize.w > 0 && (
          <div className="mt-4 flex items-center gap-3 px-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M8 11h6" />
            </svg>
            <input
              type="range"
              min={minScale}
              max={maxScale}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="h-1 w-full appearance-none rounded-full bg-border accent-accent"
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M8 11h6" /><path d="M11 8v6" />
            </svg>
          </div>
        )}

        {/* ボタン */}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold active:scale-[0.98]"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]"
          >
            決定
          </button>
        </div>
      </div>
    </div>
  );
}
