'use client';

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout/legacy';

// Note: CSS imports may fail in some Next.js setups, so we include essential styles inline below

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface WidgetGridItem {
  id: string;
  type: string;
  position?: { x: number; y: number; w: number; h: number } | null;
}

export interface DashboardGridProps {
  widgets: WidgetGridItem[];
  isEditMode: boolean;
  onLayoutChange: (layouts: WidgetLayoutUpdate[]) => void;
  children: (widget: WidgetGridItem) => React.ReactNode;
  rowHeight?: number;
}

export interface WidgetLayoutUpdate {
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const DEFAULT_WIDGET_SIZES: Record<string, { w: number; h: number; minW: number; minH: number }> = {
  chat:          { w: 4, h: 5, minW: 3, minH: 3 },
  drive:         { w: 4, h: 5, minW: 3, minH: 3 },
  calendar:      { w: 6, h: 5, minW: 4, minH: 4 },
  todo:          { w: 4, h: 5, minW: 3, minH: 3 },
  ai:            { w: 4, h: 6, minW: 3, minH: 4 },
  quickstats:    { w: 12, h: 2, minW: 6, minH: 2 },
  notifications: { w: 4, h: 4, minW: 2, minH: 3 },
  hr:            { w: 4, h: 5, minW: 3, minH: 3 },
  scheduling:    { w: 4, h: 5, minW: 3, minH: 3 },
  quicknotes:    { w: 3, h: 3, minW: 2, minH: 2 },
  bookmarks:     { w: 2, h: 3, minW: 2, minH: 2 },
  activityfeed:  { w: 4, h: 5, minW: 3, minH: 3 },
};

function getDefaultSize(type: string) {
  return DEFAULT_WIDGET_SIZES[type] || { w: 4, h: 4, minW: 2, minH: 2 };
}

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

function buildLayout(widgets: WidgetGridItem[], cols: number): LayoutItem[] {
  const layout: LayoutItem[] = [];
  let nextY = 0;
  let currentX = 0;
  let rowMaxH = 0;

  for (const widget of widgets) {
    const defaults = getDefaultSize(widget.type);

    if (widget.position && typeof widget.position.x === 'number' && typeof widget.position.y === 'number') {
      layout.push({
        i: widget.id,
        x: widget.position.x,
        y: widget.position.y,
        w: widget.position.w || defaults.w,
        h: widget.position.h || defaults.h,
        minW: defaults.minW,
        minH: defaults.minH,
      });
    } else {
      const w = Math.min(defaults.w, cols);
      const h = defaults.h;

      if (currentX + w > cols) {
        currentX = 0;
        nextY += rowMaxH;
        rowMaxH = 0;
      }

      layout.push({
        i: widget.id,
        x: currentX,
        y: nextY,
        w,
        h,
        minW: defaults.minW,
        minH: defaults.minH,
      });

      currentX += w;
      rowMaxH = Math.max(rowMaxH, h);
    }
  }

  return layout;
}

export default function DashboardGrid({
  widgets,
  isEditMode,
  onLayoutChange,
  children,
  rowHeight = 80,
}: DashboardGridProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  // Need to wait for mount because WidthProvider needs DOM measurement
  useEffect(() => {
    setMounted(true);
  }, []);

  const lgLayout = useMemo(() => buildLayout(widgets, 12), [widgets]);
  const mdLayout = useMemo(() => buildLayout(widgets, 8), [widgets]);
  const smLayout = useMemo(() => buildLayout(widgets, 4), [widgets]);
  const xsLayout = useMemo(() => buildLayout(widgets, 2), [widgets]);

  const layouts = useMemo(() => ({
    lg: lgLayout,
    md: mdLayout,
    sm: smLayout,
    xs: xsLayout,
  }), [lgLayout, mdLayout, smLayout, xsLayout]);

  const handleLayoutChange = useCallback((currentLayout: Layout) => {
    if (!isEditMode) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      const updates: WidgetLayoutUpdate[] = currentLayout.map((item) => ({
        widgetId: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      }));
      onLayoutChange(updates);
    }, 800);
  }, [isEditMode, onLayoutChange]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (widgets.length === 0) return null;

  // Don't render until mounted to allow WidthProvider to measure
  if (!mounted) {
    return <div className="dashboard-grid-loading" style={{ minHeight: 400 }} />;
  }

  return (
    <div className={`dashboard-grid ${isEditMode ? 'edit-mode' : ''}`}>
      <style>{`
        /* Base react-grid-layout styles */
        .react-grid-layout {
          position: relative;
          transition: height 200ms ease;
        }
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }
        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }
        .react-grid-item.resizing {
          z-index: 1;
          will-change: width, height;
        }
        .react-grid-item.react-draggable-dragging {
          transition: none;
          z-index: 3;
          will-change: transform;
        }
        .react-grid-item.dropping {
          visibility: hidden;
        }
        .react-grid-item.react-grid-placeholder {
          background: rgba(59, 130, 246, 0.2);
          opacity: 0.2;
          transition-duration: 100ms;
          z-index: 2;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          -o-user-select: none;
          user-select: none;
        }
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
        }
        .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-right: 2px solid rgba(0, 0, 0, 0.4);
          border-bottom: 2px solid rgba(0, 0, 0, 0.4);
        }
        .react-resizable-hide > .react-resizable-handle {
          display: none;
        }
        .react-grid-item > .react-resizable-handle.react-resizable-handle-sw {
          bottom: 0;
          left: 0;
          cursor: sw-resize;
          transform: rotate(90deg);
        }
        .react-grid-item > .react-resizable-handle.react-resizable-handle-se {
          bottom: 0;
          right: 0;
          cursor: se-resize;
        }
        .react-grid-item > .react-resizable-handle.react-resizable-handle-nw {
          top: 0;
          left: 0;
          cursor: nw-resize;
          transform: rotate(180deg);
        }
        .react-grid-item > .react-resizable-handle.react-resizable-handle-ne {
          top: 0;
          right: 0;
          cursor: ne-resize;
          transform: rotate(270deg);
        }
        .react-grid-item > .react-resizable-handle.react-resizable-handle-w,
        .react-grid-item > .react-resizable-handle.react-resizable-handle-e {
          top: 50%;
          margin-top: -10px;
          cursor: ew-resize;
        }
        .react-grid-item > .react-resizable-handle.react-resizable-handle-w {
          left: 0;
          transform: rotate(135deg);
        }
        .react-grid-item > .react-resizable-handle.react-resizable-handle-e {
          right: 0;
          transform: rotate(315deg);
        }
        .react-grid-item > .react-resizable-handle.react-resizable-handle-n,
        .react-grid-item > .react-resizable-handle.react-resizable-handle-s {
          left: 50%;
          margin-left: -10px;
          cursor: ns-resize;
        }
        .react-grid-item > .react-resizable-handle.react-resizable-handle-n {
          top: 0;
          transform: rotate(225deg);
        }
        .react-grid-item > .react-resizable-handle.react-resizable-handle-s {
          bottom: 0;
          transform: rotate(45deg);
        }

        /* Dashboard-specific styles */
        .dashboard-grid {
          min-height: 200px;
        }
        .dashboard-grid .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
          border-radius: 12px;
          overflow: hidden;
        }
        .dashboard-grid .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }
        .dashboard-grid .react-grid-item.react-draggable-dragging {
          transition: none;
          z-index: 100 !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
          opacity: 0.95;
        }
        .dashboard-grid .react-grid-item.resizing {
          transition: none;
          z-index: 100;
        }
        .dashboard-grid .react-grid-placeholder {
          background: rgba(59, 130, 246, 0.15) !important;
          border: 2px dashed rgba(59, 130, 246, 0.5) !important;
          border-radius: 12px !important;
          opacity: 1 !important;
        }
        .dashboard-grid.edit-mode .react-grid-item {
          outline: 2px dashed rgba(59, 130, 246, 0.3);
          outline-offset: -2px;
        }
        .dashboard-grid.edit-mode .react-grid-item:hover {
          outline-color: rgba(59, 130, 246, 0.6);
        }
        .dashboard-grid .react-resizable-handle {
          display: none;
        }
        .dashboard-grid.edit-mode .react-resizable-handle {
          display: block;
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          cursor: se-resize;
          z-index: 10;
        }
        .dashboard-grid.edit-mode .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 5px;
          bottom: 5px;
          width: 10px;
          height: 10px;
          border-right: 3px solid rgba(59, 130, 246, 0.6);
          border-bottom: 3px solid rgba(59, 130, 246, 0.6);
        }
      `}</style>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 8, sm: 4, xs: 2 }}
        rowHeight={rowHeight}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
        compactType="vertical"
        useCSSTransforms={true}
        measureBeforeMount={false}
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="widget-grid-item">
            {children(widget)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

export { DEFAULT_WIDGET_SIZES, getDefaultSize };
