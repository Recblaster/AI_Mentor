import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Square, 
  Circle, 
  Type, 
  ArrowRight, 
  Trash2, 
  Download,
  Upload,
  RotateCcw,
  Grid3X3,
  Palette,
  Settings,
  Copy,
  Layers
} from "lucide-react";

interface CanvasElement {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'arrow';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
}

interface CanvasWorkspaceProps {
  elements: CanvasElement[];
  onElementsChange: (elements: CanvasElement[]) => void;
  onClose: () => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  elements,
  onElementsChange,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedTool, setSelectedTool] = useState<'move' | 'rectangle' | 'circle' | 'text' | 'arrow'>('move');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [currentStrokeColor, setCurrentStrokeColor] = useState('#1e40af');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!showGrid) return;
    
    const gridSize = 20 * zoom;
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;
    
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    
    // Vertical lines
    for (let x = offsetX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = offsetY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  }, [zoom, pan, showGrid]);

  const drawElement = useCallback((ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    const x = (element.x + pan.x) * zoom;
    const y = (element.y + pan.y) * zoom;
    const width = element.width * zoom;
    const height = element.height * zoom;
    
    ctx.strokeStyle = element.strokeColor;
    ctx.fillStyle = element.color;
    ctx.lineWidth = element.strokeWidth;
    
    switch (element.type) {
      case 'rectangle':
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + height/2, width/2, height/2, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        break;
      case 'text':
        ctx.font = `${16 * zoom}px Inter, sans-serif`;
        ctx.fillStyle = element.strokeColor;
        ctx.fillText(element.text || '', x, y + 16 * zoom);
        break;
      case 'arrow':
        ctx.beginPath();
        ctx.moveTo(x, y + height/2);
        ctx.lineTo(x + width - 10 * zoom, y + height/2);
        ctx.lineTo(x + width - 20 * zoom, y + height/2 - 10 * zoom);
        ctx.moveTo(x + width - 10 * zoom, y + height/2);
        ctx.lineTo(x + width - 20 * zoom, y + height/2 + 10 * zoom);
        ctx.stroke();
        break;
    }
    
    // Draw selection outline
    if (selectedElement === element.id) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
      ctx.setLineDash([]);
      
      // Draw resize handles
      const handleSize = 8;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
      ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    }
  }, [zoom, pan, selectedElement]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas);
    
    // Draw elements
    elements.forEach(element => drawElement(ctx, element));
  }, [elements, drawGrid, drawElement]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      redraw();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redraw]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom
    };
  };

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    
    if (selectedTool === 'move') {
      // Check if clicking on an element
      const clickedElement = elements.find(el => 
        coords.x >= el.x && coords.x <= el.x + el.width &&
        coords.y >= el.y && coords.y <= el.y + el.height
      );
      
      setSelectedElement(clickedElement?.id || null);
      
      if (clickedElement) {
        setIsDragging(true);
        setDragStart({ x: coords.x - clickedElement.x, y: coords.y - clickedElement.y });
      }
    } else {
      // Start drawing new element
      setIsDrawing(true);
      setDrawStart(coords);
    }
  }, [selectedTool, elements]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    
    if (isDragging && selectedElement) {
      // Move selected element
      const updatedElements = elements.map(el => 
        el.id === selectedElement 
          ? { ...el, x: coords.x - dragStart.x, y: coords.y - dragStart.y }
          : el
      );
      onElementsChange(updatedElements);
    } else if (isDrawing && selectedTool !== 'move') {
      // Update drawing element size
      const width = Math.abs(coords.x - drawStart.x);
      const height = Math.abs(coords.y - drawStart.y);
      const x = Math.min(coords.x, drawStart.x);
      const y = Math.min(coords.y, drawStart.y);
      
      // Create temporary element for preview
      const tempElement: CanvasElement = {
        id: 'temp',
        type: selectedTool,
        x, y, width, height,
        text: selectedTool === 'text' ? 'New Text' : undefined,
        color: selectedTool === 'text' ? 'transparent' : currentColor,
        strokeColor: currentStrokeColor,
        strokeWidth
      };
      
      // Remove any existing temp element and add new one
      const filteredElements = elements.filter(el => el.id !== 'temp');
      onElementsChange([...filteredElements, tempElement]);
    }
  }, [isDragging, isDrawing, selectedElement, selectedTool, dragStart, drawStart, elements, currentColor, currentStrokeColor, strokeWidth, onElementsChange]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isDrawing && selectedTool !== 'move') {
      // Finalize the drawing
      const tempElement = elements.find(el => el.id === 'temp');
      if (tempElement && (tempElement.width > 5 || tempElement.height > 5)) {
        const finalElement = { ...tempElement, id: Date.now().toString() };
        const filteredElements = elements.filter(el => el.id !== 'temp');
        onElementsChange([...filteredElements, finalElement]);
        setSelectedElement(finalElement.id);
      } else {
        // Remove temp element if too small
        onElementsChange(elements.filter(el => el.id !== 'temp'));
      }
    }
    
    setIsDragging(false);
    setIsDrawing(false);
  }, [isDrawing, selectedTool, elements, onElementsChange]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDeleteSelected = () => {
    if (selectedElement) {
      onElementsChange(elements.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
    }
  };

  const handleClearCanvas = () => {
    onElementsChange([]);
    setSelectedElement(null);
  };

  const handleDuplicateSelected = () => {
    if (selectedElement) {
      const elementToDuplicate = elements.find(el => el.id === selectedElement);
      if (elementToDuplicate) {
        const duplicatedElement = {
          ...elementToDuplicate,
          id: Date.now().toString(),
          x: elementToDuplicate.x + 20,
          y: elementToDuplicate.y + 20
        };
        onElementsChange([...elements, duplicatedElement]);
        setSelectedElement(duplicatedElement.id);
      }
    }
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'canvas-export.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Canvas Workspace</h2>
          <Badge variant="secondary" className="font-mono">
            Zoom: {Math.round(zoom * 100)}%
          </Badge>
          <Badge variant="outline" className="font-mono">
            Elements: {elements.length}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportCanvas}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCanvas}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center space-x-2">
          {/* Drawing Tools */}
          <div className="flex items-center space-x-1 bg-background rounded-lg p-1 border">
            <Button
              variant={selectedTool === 'move' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('move')}
              className="h-8 w-8 p-0"
            >
              <Move className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'rectangle' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('rectangle')}
              className="h-8 w-8 p-0"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'circle' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('circle')}
              className="h-8 w-8 p-0"
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('text')}
              className="h-8 w-8 p-0"
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'arrow' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('arrow')}
              className="h-8 w-8 p-0"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: currentColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Fill Color</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded border-2 ${currentColor === color ? 'border-primary' : 'border-border'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setCurrentColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Stroke Color</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded border-2 ${currentStrokeColor === color ? 'border-primary' : 'border-border'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setCurrentStrokeColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Stroke Width: {strokeWidth}px</Label>
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant={showGrid ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            className="h-8 w-8 p-0"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-background rounded-lg p-1 border">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetView} className="h-8 w-8 p-0">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />
          
          {/* Element Actions */}
          {selectedElement && (
            <div className="flex items-center space-x-1 bg-background rounded-lg p-1 border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDuplicateSelected}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteSelected}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-muted/10">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 border-t border-border bg-muted/30 text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-xs">
            Tool: {selectedTool}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Elements: {elements.length}
          </Badge>
          {selectedElement && (
            <Badge variant="outline" className="text-xs">
              Selected: {selectedElement}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>Pan: ({Math.round(pan.x)}, {Math.round(pan.y)})</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
};