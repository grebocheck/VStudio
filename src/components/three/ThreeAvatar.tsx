import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Download, RotateCcw, Rotate3D, ScanLine } from 'lucide-react';
import type { AvatarConfig, RigParams } from '../../types';
import type { Avatar3DScene } from './avatar3DScene';
import { registerAvatar3DSurface } from './avatar3DRegistry';

interface Props {
  config: AvatarConfig;
  rig: RigParams;
  svgRef?: React.Ref<SVGSVGElement>;
  transparent?: boolean;
  onScreenBuster?: boolean;
}

export function ThreeAvatar({ config, rig, svgRef, onScreenBuster = false }: Props) {
  const en = typeof document === 'undefined' || document.documentElement.lang !== 'uk';
  const interactive = Boolean(svgRef);
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const proxy = useRef<SVGSVGElement | null>(null);
  const controller = useRef<Avatar3DScene | null>(null);
  const latest = useRef({ config, rig });
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [turntable, setTurntable] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const bindProxy = useCallback((node: SVGSVGElement | null) => {
    proxy.current = node;
  }, []);
  useImperativeHandle(svgRef, () => proxy.current!, []);
  useEffect(() => {
    latest.current = { config, rig };
    controller.current?.setFrame(config, rig);
  }, [config, rig]);
  useEffect(() => {
    if (!canvas.current || !host.current) return;
    let cancelled = false,
      raf = 0,
      lastTime = 0;
    let instance: Avatar3DScene | undefined;
    const abort = new AbortController();
    let unregister: (() => void) | undefined;
    const resize = () => {
      if (host.current && instance) {
        const bounds = host.current.getBoundingClientRect();
        instance.resize(bounds.width, bounds.height);
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host.current);
    const element = canvas.current;
    void import('./avatar3DScene')
      .then(({ createAvatar3DScene }) =>
        createAvatar3DScene(element, latest.current.config, latest.current.rig, interactive, abort.signal),
      )
      .then((scene) => {
        if (cancelled) {
          scene.dispose();
          return;
        }
        instance = scene;
        controller.current = scene;
        resize();
        if (proxy.current)
          unregister = registerAvatar3DSurface(proxy.current, {
            canvas: scene.canvas,
            applyFrame: (nextConfig, nextRig) => {
              latest.current = { config: nextConfig, rig: nextRig };
              scene.setFrame(nextConfig, nextRig);
            },
            drawToCanvas: scene.drawToCanvas,
            exportGlb: scene.exportGlb,
          });
        scene.canvas.dataset.ready = 'true';
        scene.canvas.dataset.triangles = String(scene.stats.triangles);
        scene.canvas.dataset.bones = String(scene.stats.bones);
        scene.canvas.dataset.morphTargets = String(scene.stats.morphTargets);
        setStatus('ready');
        const loop = (time: number) => {
          scene.render(lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0);
          lastTime = time;
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'WebGL is unavailable');
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
      abort.abort();
      cancelAnimationFrame(raf);
      observer.disconnect();
      unregister?.();
      instance?.dispose();
      controller.current = null;
    };
  }, [attempt, interactive]);
  useEffect(() => {
    controller.current?.setWireframe(wireframe || onScreenBuster);
  }, [wireframe, onScreenBuster, status]);
  const exportGlb = async () => {
    if (!controller.current) return;
    setExporting(true);
    setError('');
    try {
      const blob = await controller.current.exportGlb();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'aurelia-starlight.glb';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };
  return (
    <div ref={host} className="three-avatar premium-avatar relative w-full aspect-square" data-avatar3d-host="true">
      <canvas
        ref={canvas}
        data-avatar3d="true"
        role="img"
        aria-label={en ? 'Aurelia Starlight interactive 3D avatar' : 'Інтерактивний 3D-аватар Аурелія'}
        className="h-full w-full touch-none"
      />
      <svg
        ref={bindProxy}
        data-model="aurelia-3d"
        data-avatar3d-proxy="true"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 400"
        width="1"
        height="1"
        aria-hidden="true"
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
      {status === 'loading' && (
        <div className="three-avatar-status" role="status">
          {en ? 'Preparing the 3D model…' : 'Готуємо 3D-модель…'}
        </div>
      )}
      {status === 'error' && (
        <div className="three-avatar-status" role="alert">
          <p>{en ? 'Could not open the 3D model.' : 'Не вдалося відкрити 3D-модель.'}</p>
          <p>{error}</p>
          <button
            onClick={() => {
              setStatus('loading');
              setAttempt((value) => value + 1);
            }}
          >
            {en ? 'Retry' : 'Спробувати ще'}
          </button>
        </div>
      )}
      {status === 'ready' && interactive && (
        <div
          className="three-avatar-tools"
          role="group"
          aria-label={en ? '3D view controls' : 'Керування 3D-переглядом'}
        >
          <span>{en ? 'Drag to orbit · scroll to zoom' : 'Тягніть для обертання · колесо — масштаб'}</span>
          <button
            title={en ? 'Front view' : 'Вигляд спереду'}
            aria-label={en ? 'Front view' : 'Вигляд спереду'}
            onClick={() => {
              controller.current?.resetView();
              controller.current?.setTurntable(false);
              setTurntable(false);
            }}
          >
            <RotateCcw size={15} />
          </button>
          <button
            title={en ? 'Turntable' : 'Обертання навколо'}
            aria-label={en ? 'Turntable' : 'Обертання навколо'}
            aria-pressed={turntable}
            onClick={() => {
              controller.current?.setTurntable(!turntable);
              setTurntable(!turntable);
            }}
          >
            <Rotate3D size={15} />
          </button>
          <button
            title={en ? 'Wireframe' : 'Сітка моделі'}
            aria-label={en ? 'Wireframe' : 'Сітка моделі'}
            aria-pressed={wireframe}
            onClick={() => setWireframe(!wireframe)}
          >
            <ScanLine size={15} />
          </button>
          <button
            title={en ? 'Download GLB' : 'Завантажити GLB'}
            aria-label={en ? 'Download GLB' : 'Завантажити GLB'}
            disabled={exporting}
            onClick={() => void exportGlb()}
          >
            <Download size={15} />
            <span>GLB</span>
          </button>
        </div>
      )}
      {status === 'ready' && error && (
        <p className="three-avatar-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
