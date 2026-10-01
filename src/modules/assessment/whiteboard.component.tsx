import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/index.js';
import { Pencil, Eraser, RotateCcw, Palette, FileText } from 'lucide-react';

interface WhiteboardProps {
  initialText?: string;
  initialDrawing?: string;
  onChange: (data: { drawingDataUrl: string; explanationText: string }) => void;
}

export function Whiteboard({ initialText = '', initialDrawing, onChange }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#2563eb'); // Default blue
  const [lineWidth, _setLineWidth] = useState(3);
  const [explanationText, setExplanationText] = useState(initialText);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background with clean white/card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (initialDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialDrawing;
    }
  }, []);

  // Notify parent on change
  const notifyChange = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const drawingDataUrl = canvas.toDataURL('image/png');
    onChange({ drawingDataUrl, explanationText });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      notifyChange();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    notifyChange();
  };

  const handleTextChange = (text: string) => {
    setExplanationText(text);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const drawingDataUrl = canvas.toDataURL('image/png');
    onChange({ drawingDataUrl, explanationText: text });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-base text-foreground">Interactive Solution Whiteboard</h3>
          <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase">Logical Workspace</span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant={tool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('pen')}
            className="gap-1.5 font-bold"
          >
            <Pencil className="w-4 h-4" /> Pen
          </Button>

          <Button
            type="button"
            variant={tool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('eraser')}
            className="gap-1.5 font-bold"
          >
            <Eraser className="w-4 h-4" /> Eraser
          </Button>

          {/* Color Picker palette */}
          {tool === 'pen' && (
            <div className="flex items-center gap-1.5 ml-2 border-l border-border pl-2">
              {['#2563eb', '#dc2626', '#16a34a', '#000000'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'opacity-80 hover:opacity-100'}`}
                />
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearCanvas}
            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 font-bold ml-2"
          >
            <RotateCcw className="w-4 h-4" /> Clear
          </Button>
        </div>
      </div>

      {/* Canvas Drawing Surface */}
      <div className="relative border border-border rounded-xl overflow-hidden bg-white shadow-inner mb-4 cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={750}
          height={300}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[300px] touch-none block"
        />
        <div className="absolute bottom-2 right-3 pointer-events-none text-[11px] text-muted-foreground font-mono bg-white/80 px-2 py-0.5 rounded border border-border">
          Scratchpad / Flowchart Area
        </div>
      </div>

      {/* Written Logic / Solution Text Box */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Step-by-Step Logic / Explanation (Optional Notes for HR)
          </label>
        </div>
        <textarea
          value={explanationText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Explain your approach, algorithm logic, or step-by-step reasoning here..."
          rows={3}
          className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
        />
      </div>
    </div>
  );
}
