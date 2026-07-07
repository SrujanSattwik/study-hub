import React, { useRef, useEffect, useState } from 'react';
import Button from '../../components/ui/Button';

interface WhiteboardCanvasProps {
  isConnected: boolean;
  socket: any;
  sendDraw: (data: any) => void;
  sendClearWhiteboard: () => void;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  isConnected,
  socket,
  sendDraw,
  sendClearWhiteboard,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#4f46e5');
  const [lineWidth, setLineWidth] = useState(3);
  const drawingPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Responsive size setup
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = 400;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    contextRef.current = ctx;
  }, []);

  // Update canvas style properties when states change
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth]);

  // Synchronize drawings from socket
  useEffect(() => {
    if (!socket) return;

    const handleDrawEvent = (data: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      color: string;
      lineWidth: number;
    }) => {
      const ctx = contextRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;

      // Scale coordinates back to local canvas resolution
      const x0 = data.x0 * canvas.width;
      const y0 = data.y0 * canvas.height;
      const x1 = data.x1 * canvas.width;
      const y1 = data.y1 * canvas.height;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.lineWidth;
      ctx.stroke();
      ctx.closePath();

      // Restore local brush settings
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    };

    const handleClearEvent = () => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    socket.on('drawEvent', handleDrawEvent);
    socket.on('clearWhiteboardEvent', handleClearEvent);

    return () => {
      socket.off('drawEvent', handleDrawEvent);
      socket.off('clearWhiteboardEvent', handleClearEvent);
    };
  }, [socket, color, lineWidth]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    drawingPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    const rect = canvas.getBoundingClientRect();

    const x0 = drawingPos.current.x;
    const y0 = drawingPos.current.y;
    const x1 = e.clientX - rect.left;
    const y1 = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();

    // Emit normal coordinate ratio to align sizes on other screen aspect ratios
    sendDraw({
      x0: x0 / canvas.width,
      y0: y0 / canvas.height,
      x1: x1 / canvas.width,
      y1: y1 / canvas.height,
      color,
      lineWidth,
    });

    drawingPos.current = { x: x1, y: y1 };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sendClearWhiteboard();
    }
  };

  const colors = ['#4f46e5', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#111827'];

  return (
    <div className="space-y-4">
      {/* Tool bar */}
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-150 flex-wrap gap-3">
        <div className="flex gap-2 items-center">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border border-black/10 transition-transform ${
                color === c ? 'scale-125 ring-2 ring-indigo-600/20' : ''
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold uppercase">Size</span>
            <input
              type="range"
              min={1}
              max={15}
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-20 accent-indigo-600"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={handleClear}>
            Clear Board
          </Button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full bg-white cursor-crosshair block"
        />
      </div>
    </div>
  );
};
export default WhiteboardCanvas;
