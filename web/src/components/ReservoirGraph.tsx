import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { INode, ILink, IGraphData } from '@data/reservoirData';

interface ReservoirGraphProps {
  data: IGraphData;
}

// Layout constants
const LAYOUT = {
  NODE_SPACING: 40,
  HORIZONTAL_SPACING: 220,
  PADDING: 100,
  MAIN_RECT_WIDTH: 180,
  MAIN_RECT_HEIGHT: 80,
  MAIN_RECT_PADDING: 10,
  MAIN_RECT_RADIUS: 12,
  NODE_RADIUS: 12,
  LEGEND_WIDTH: 63,
  LEGEND_ITEM_HEIGHT: 14,
  LEGEND_PADDING: 16,
  LEGEND_OFFSET: 40,
} as const;

// Zoom constants
const ZOOM = {
  MIN_SCALE: 0.5,
  MAX_SCALE: 3,
  INITIAL_SCALE: 0.8,
  ZOOM_IN_FACTOR: 1.3,
  ZOOM_OUT_FACTOR: 0.7,
} as const;

// Color scheme
const COLOR_MAP = {
  main_reservoir: { fill: '#5B7FDB', stroke: '#4A6BC5', label: 'Main Reservoir' },
  inflow: { fill: '#E88BA8', stroke: '#D67A97', label: 'Inflows' },
  outflow: { fill: '#4DB8D8', stroke: '#3CA7C7', label: 'Outflows' },
  project: { fill: '#4DB89A', stroke: '#3CA789', label: 'Projects' },
} as const;

// Button styles
const BUTTON_STYLE: React.CSSProperties = {
  width: '36px',
  height: '36px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  background: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
};

const ReservoirGraph = ({ data }: ReservoirGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(ZOOM.INITIAL_SCALE);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Clear previous renders
    svg.selectAll('*').remove();

    // Create defs for arrowheads FIRST (before any other elements)
    const defs = svg.append('defs');

    // Create arrowhead marker
    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 10)
      .attr('refY', 5)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', 'context-stroke');

    const nodes: INode[] = data.nodes.map((d) => Object.create(d));
    const links: ILink[] = data.links.map((d) => Object.create(d));
    
    // Position nodes in fixed layout
    const inflowNodes = nodes.filter((n) => n.type === 'inflow');
    const outflowNodes = nodes.filter((n) => n.type === 'outflow');
    const projectNodes = nodes.filter((n) => n.type === 'project');
    const mainNode = nodes.find((n) => n.type === 'main_reservoir');

    // Calculate total height needed
    const totalRightHeight = (outflowNodes.length + projectNodes.length) * LAYOUT.NODE_SPACING;
    
    // Calculate positions relative to content center
    const contentCenterX = 0;
    const contentCenterY = 0;
    
    const leftX = contentCenterX;
    const rightX = contentCenterX;

    // Position main reservoir (center)
    if (mainNode) {
      mainNode.fx = contentCenterX;
      mainNode.fy = contentCenterY;
    }

    // Position inflows (left side, vertically centered)
    const inflowStartY = contentCenterY - ((inflowNodes.length - 1) * LAYOUT.NODE_SPACING) / 2;
    inflowNodes.forEach((node, i) => {
      node.fx = leftX - LAYOUT.HORIZONTAL_SPACING;
      node.fy = inflowStartY + i * LAYOUT.NODE_SPACING;
    });

    // Position outflows and projects on the right side
    const hasOutflows = outflowNodes.length > 0;
    const hasProjects = projectNodes.length > 0;
    
    let outflowStartY = contentCenterY;
    let projectStartY = contentCenterY;

    if (hasOutflows && hasProjects) {
      // Both exist: outflows in top-half, projects in bottom-half
      const outflowConnectorY = contentCenterY - LAYOUT.MAIN_RECT_HEIGHT / 4;
      const projectConnectorY = contentCenterY + LAYOUT.MAIN_RECT_HEIGHT / 4;
      
      const outflowsHeight = (outflowNodes.length - 1) * LAYOUT.NODE_SPACING;
      outflowStartY = outflowConnectorY - outflowsHeight;
      projectStartY = projectConnectorY;
      
      outflowNodes.forEach((node, i) => {
        node.fx = rightX + LAYOUT.HORIZONTAL_SPACING;
        node.fy = outflowStartY + i * LAYOUT.NODE_SPACING;
      });
      
      projectNodes.forEach((node, i) => {
        node.fx = rightX + LAYOUT.HORIZONTAL_SPACING;
        node.fy = projectStartY + i * LAYOUT.NODE_SPACING;
      });
    } else if (hasOutflows) {
      outflowStartY = contentCenterY - ((outflowNodes.length - 1) * LAYOUT.NODE_SPACING) / 2;
      outflowNodes.forEach((node, i) => {
        node.fx = rightX + LAYOUT.HORIZONTAL_SPACING;
        node.fy = outflowStartY + i * LAYOUT.NODE_SPACING;
      });
    } else if (hasProjects) {
      projectStartY = contentCenterY - ((projectNodes.length - 1) * LAYOUT.NODE_SPACING) / 2;
      projectNodes.forEach((node, i) => {
        node.fx = rightX + LAYOUT.HORIZONTAL_SPACING;
        node.fy = projectStartY + i * LAYOUT.NODE_SPACING;
      });
    }

    // Calculate bounds for viewBox
    const minX = leftX - LAYOUT.HORIZONTAL_SPACING - LAYOUT.PADDING;
    const maxX = rightX + LAYOUT.HORIZONTAL_SPACING + 200;
    const minY = Math.min(inflowStartY, outflowStartY) - LAYOUT.PADDING;
    const maxY = Math.max(
      inflowStartY + (inflowNodes.length - 1) * LAYOUT.NODE_SPACING,
      projectStartY + (projectNodes.length - 1) * LAYOUT.NODE_SPACING
    ) + LAYOUT.PADDING;
    
    const viewBoxWidth = maxX - minX;
    const viewBoxHeight = maxY - minY;

    // Set viewBox to center content
    svg.attr('viewBox', `${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`);
    svg.attr('preserveAspectRatio', 'xMidYMid meet');

    // Create main group for zoom/pan
    const mainGroup = svg.append('g').attr('class', 'main-group');

    // Setup zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM.MIN_SCALE, ZOOM.MAX_SCALE])
      .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoomBehavior);
    
    // Set initial zoom
    svg.call(zoomBehavior.transform, d3.zoomIdentity.scale(ZOOM.INITIAL_SCALE));
    
    zoomBehaviorRef.current = zoomBehavior;

    // Draw links with right-angle connectors
    const linkGroup = mainGroup.append('g').attr('class', 'links');

    links.forEach((link) => {
      const source = nodes.find((n) => n.id === link.source);
      const target = nodes.find((n) => n.id === link.target);
      if (!source || !target) return;

      const targetType = target.type === 'main_reservoir' 
        ? (source.type === 'inflow' ? 'inflow' : source.type)
        : target.type;
      
      const color = COLOR_MAP[targetType as keyof typeof COLOR_MAP];

      // Create right-angle path
      let x1 = source.fx!;
      let y1 = source.fy!;
      const x2 = target.fx!;
      const y2 = target.fy!;
      
      // For outflows from main node, start from top-right of rectangle
      // For projects from main node, start from bottom-right of rectangle
      if (source.type === 'main_reservoir') {
        x1 = source.fx! + LAYOUT.MAIN_RECT_WIDTH / 2;
        
        if (target.type === 'outflow') {
          y1 = source.fy! - LAYOUT.MAIN_RECT_HEIGHT / 4;
        } else if (target.type === 'project') {
          y1 = source.fy! + LAYOUT.MAIN_RECT_HEIGHT / 4;
        }
      }
      
      // Calculate midpoint for right angle
      const midX = (x1 + x2) / 2;
      
      // Create path with right angles: horizontal from source, vertical turn, horizontal to target
      const pathData = `M ${x1},${y1} L ${midX},${y1} L ${midX},${y2} L ${x2},${y2}`;

      linkGroup
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', color.stroke)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,3');
    });

    // Draw nodes
    const nodeGroup = mainGroup.append('g').attr('class', 'nodes');

    nodes.forEach((node) => {
      const g = nodeGroup.append('g').attr('transform', `translate(${node.fx},${node.fy})`);

      if (node.type === 'main_reservoir') {
        // Draw rounded rectangle for main reservoir
        g.append('rect')
          .attr('x', -LAYOUT.MAIN_RECT_WIDTH / 2)
          .attr('y', -LAYOUT.MAIN_RECT_HEIGHT / 2)
          .attr('width', LAYOUT.MAIN_RECT_WIDTH)
          .attr('height', LAYOUT.MAIN_RECT_HEIGHT)
          .attr('rx', LAYOUT.MAIN_RECT_RADIUS)
          .attr('fill', COLOR_MAP.main_reservoir.fill)
          .attr('stroke', COLOR_MAP.main_reservoir.stroke)
          .attr('stroke-width', 2);

        // Add text with wrapping and dynamic font sizing
        const maxWidth = LAYOUT.MAIN_RECT_WIDTH - LAYOUT.MAIN_RECT_PADDING * 2;
        const maxHeight = LAYOUT.MAIN_RECT_HEIGHT - LAYOUT.MAIN_RECT_PADDING * 2;
        
        // Create a temporary text element to measure
        const tempText = g.append('text')
          .attr('font-family', 'sans-serif')
          .attr('font-weight', '600')
          .attr('fill', 'white')
          .style('visibility', 'hidden');
        
        // Function to wrap text
        const wrapText = (text: string, maxWidth: number, fontSize: number) => {
          const words = text.split(/\s+/);
          const lines: string[] = [];
          let currentLine = '';
          
          tempText.attr('font-size', `${fontSize}px`);
          
          words.forEach((word) => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            tempText.text(testLine);
            const width = (tempText.node() as SVGTextElement).getComputedTextLength();
            
            if (width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          });
          
          if (currentLine) {
            lines.push(currentLine);
          }
          
          return lines;
        };
        
        // Try different font sizes to fit the text
        let fontSize = 16;
        let lines: string[] = [];
        let lineHeight = 0;
        
        while (fontSize >= 10) {
          lines = wrapText(node.label, maxWidth, fontSize);
          lineHeight = fontSize * 1.2;
          const totalHeight = lines.length * lineHeight;
          
          if (totalHeight <= maxHeight) {
            break;
          }
          fontSize -= 1;
        }
        
        // Remove temporary text
        tempText.remove();
        
        // Calculate starting Y position to center the text block
        const totalTextHeight = lines.length * lineHeight;
        const startY = -totalTextHeight / 2 + lineHeight * 0.8;
        
        // Draw each line
        lines.forEach((line, i) => {
          g.append('text')
            .attr('x', 0)
            .attr('y', startY + i * lineHeight)
            .attr('text-anchor', 'middle')
            .attr('font-family', 'sans-serif')
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', '600')
            .attr('fill', 'white')
            .text(line);
        });
      } else {
        // Draw circle for other nodes
        const color = COLOR_MAP[node.type as keyof typeof COLOR_MAP];
        
        g.append('circle')
          .attr('r', LAYOUT.NODE_RADIUS)
          .attr('fill', color.fill)
          .attr('stroke', color.stroke)
          .attr('stroke-width', 2);

        // Position labels: left side (inflows) to the left, right side to the right
        const isInflow = node.type === 'inflow';
        const textX = isInflow ? -20 : 20;
        const textAnchor = isInflow ? 'end' : 'start';

        // Add label with white outline
        g.append('text')
          .attr('x', textX)
          .attr('y', 5)
          .attr('text-anchor', textAnchor)
          .attr('font-family', 'sans-serif')
          .attr('font-size', '13px')
          .attr('stroke', 'white')
          .attr('stroke-width', 3)
          .attr('stroke-linejoin', 'round')
          .style('pointer-events', 'none')
          .text(node.label);

        g.append('text')
          .attr('x', textX)
          .attr('y', 5)
          .attr('text-anchor', textAnchor)
          .attr('font-family', 'sans-serif')
          .attr('font-size', '13px')
          .attr('fill', '#333')
          .style('pointer-events', 'none')
          .text(node.label);
      }
    });

    // Draw compact legend below the bottommost node
    const legendItems = [
      { type: 'inflow', label: 'Inflows' },
      { type: 'outflow', label: 'Outflows' },
      { type: 'project', label: 'Projects' },
      { type: 'main_reservoir', label: 'Main' },
    ];

    const bottomMostY = Math.max(...nodes.map(n => n.fy || 0));
    const legendHeight = legendItems.length * LAYOUT.LEGEND_ITEM_HEIGHT + LAYOUT.LEGEND_PADDING;
    const legendX = maxX - LAYOUT.LEGEND_WIDTH - 10;
    const legendY = bottomMostY + LAYOUT.LEGEND_OFFSET;

    const legend = mainGroup.append('g').attr('class', 'legend');

    // Legend background
    legend
      .append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', LAYOUT.LEGEND_WIDTH)
      .attr('height', legendHeight)
      .attr('fill', 'white')
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .attr('opacity', 0.95);

    // Legend title
    legend
      .append('text')
      .attr('x', legendX + 7)
      .attr('y', legendY + 11)
      .attr('font-family', 'sans-serif')
      .attr('font-size', '8px')
      .attr('font-weight', '700')
      .attr('fill', '#333')
      .text('Legend');

    // Legend items (stacked vertically)
    legendItems.forEach((item, i) => {
      const color = COLOR_MAP[item.type as keyof typeof COLOR_MAP];
      const itemY = legendY + 23 + i * LAYOUT.LEGEND_ITEM_HEIGHT;

      legend
        .append('circle')
        .attr('cx', legendX + 9)
        .attr('cy', itemY)
        .attr('r', 3.5)
        .attr('fill', color.fill)
        .attr('stroke', color.stroke)
        .attr('stroke-width', 0.7);

      legend
        .append('text')
        .attr('x', legendX + 16)
        .attr('y', itemY + 3)
        .attr('font-family', 'sans-serif')
        .attr('font-size', '7px')
        .attr('fill', '#333')
        .text(item.label);
    });
    // Cleanup function
    return () => {
      if (zoomBehaviorRef.current && svgRef.current) {
        d3.select(svgRef.current).on('.zoom', null);
      }
    };
  }, [data]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().call(zoomBehaviorRef.current.scaleBy, ZOOM.ZOOM_IN_FACTOR);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().call(zoomBehaviorRef.current.scaleBy, ZOOM.ZOOM_OUT_FACTOR);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%', background: '#F5F5F0' }} />
      
      {/* Zoom Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'white',
          padding: '8px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          border: '1px solid #ccc',
        }}
      >
        <button
          onClick={handleZoomIn}
          style={{ ...BUTTON_STYLE, fontSize: '18px', fontWeight: 'bold' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
          title="Zoom In"
          aria-label="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          style={{ ...BUTTON_STYLE, fontSize: '18px', fontWeight: 'bold' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleResetZoom}
          style={{ ...BUTTON_STYLE, fontSize: '16px' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
          title="Reset Zoom"
          aria-label="Reset Zoom"
        >
          ⊙
        </button>
        <div
          style={{
            fontSize: '10px',
            color: '#666',
            textAlign: 'center',
            marginTop: '4px',
          }}
        >
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>
    </div>
  );
};

export default ReservoirGraph;
