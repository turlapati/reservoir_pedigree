import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReservoirGraph from './ReservoirGraph';
import type { IGraphData } from '@data/reservoirData';

// Mock D3 to avoid issues with SVG rendering in tests
vi.mock('d3', async () => {
  const actual = await vi.importActual('d3');
  return {
    ...actual,
    select: vi.fn(() => ({
      attr: vi.fn().mockReturnThis(),
      append: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      remove: vi.fn().mockReturnThis(),
      call: vi.fn().mockReturnThis(),
      transition: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      style: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      node: vi.fn(() => ({
        getComputedTextLength: () => 50,
      })),
    })),
  };
});

describe('ReservoirGraph', () => {
  const mockData: IGraphData = {
    nodes: [
      { id: 'main', label: 'Main Reservoir', type: 'main_reservoir' },
      { id: 'inflow1', label: 'Inflow 1', type: 'inflow' },
      { id: 'outflow1', label: 'Outflow 1', type: 'outflow' },
      { id: 'project1', label: 'Project 1', type: 'project' },
    ],
    links: [
      { source: 'inflow1', target: 'main' },
      { source: 'main', target: 'outflow1' },
      { source: 'main', target: 'project1' },
    ],
  };

  const emptyData: IGraphData = {
    nodes: [],
    links: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component without crashing', () => {
      const { container } = render(<ReservoirGraph data={mockData} />);
      expect(container).toBeInTheDocument();
    });

    it('should render an SVG element', () => {
      const { container } = render(<ReservoirGraph data={mockData} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render zoom control buttons', () => {
      render(<ReservoirGraph data={mockData} />);
      
      const zoomInButton = screen.getByTitle('Zoom In');
      const zoomOutButton = screen.getByTitle('Zoom Out');
      const resetZoomButton = screen.getByTitle('Reset Zoom');
      
      expect(zoomInButton).toBeInTheDocument();
      expect(zoomOutButton).toBeInTheDocument();
      expect(resetZoomButton).toBeInTheDocument();
    });

    it('should display initial zoom level', () => {
      render(<ReservoirGraph data={mockData} />);
      
      // Initial zoom is 80%
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('should render with empty data', () => {
      const { container } = render(<ReservoirGraph data={emptyData} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-labels on zoom buttons', () => {
      render(<ReservoirGraph data={mockData} />);
      
      expect(screen.getByLabelText('Zoom In')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom Out')).toBeInTheDocument();
      expect(screen.getByLabelText('Reset Zoom')).toBeInTheDocument();
    });

    it('should have title attributes on zoom buttons', () => {
      render(<ReservoirGraph data={mockData} />);
      
      const zoomInButton = screen.getByTitle('Zoom In');
      const zoomOutButton = screen.getByTitle('Zoom Out');
      const resetZoomButton = screen.getByTitle('Reset Zoom');
      
      expect(zoomInButton).toHaveAttribute('title', 'Zoom In');
      expect(zoomOutButton).toHaveAttribute('title', 'Zoom Out');
      expect(resetZoomButton).toHaveAttribute('title', 'Reset Zoom');
    });
  });

  describe('Zoom Controls', () => {
    it('should have clickable zoom in button', () => {
      render(<ReservoirGraph data={mockData} />);
      const zoomInButton = screen.getByTitle('Zoom In');
      
      expect(zoomInButton).toBeEnabled();
      fireEvent.click(zoomInButton);
      // Button should be clickable without errors
    });

    it('should have clickable zoom out button', () => {
      render(<ReservoirGraph data={mockData} />);
      const zoomOutButton = screen.getByTitle('Zoom Out');
      
      expect(zoomOutButton).toBeEnabled();
      fireEvent.click(zoomOutButton);
      // Button should be clickable without errors
    });

    it('should have clickable reset zoom button', () => {
      render(<ReservoirGraph data={mockData} />);
      const resetZoomButton = screen.getByTitle('Reset Zoom');
      
      expect(resetZoomButton).toBeEnabled();
      fireEvent.click(resetZoomButton);
      // Button should be clickable without errors
    });

    it('should apply hover styles to buttons', () => {
      render(<ReservoirGraph data={mockData} />);
      const zoomInButton = screen.getByTitle('Zoom In');
      
      // Initial background should be white
      expect(zoomInButton).toHaveStyle({ background: 'white' });
      
      // Hover should change background
      fireEvent.mouseEnter(zoomInButton);
      expect(zoomInButton).toHaveStyle({ background: '#f0f0f0' });
      
      // Mouse leave should restore background
      fireEvent.mouseLeave(zoomInButton);
      expect(zoomInButton).toHaveStyle({ background: 'white' });
    });
  });

  describe('Data Handling', () => {
    it('should handle data with only inflows', () => {
      const inflowOnlyData: IGraphData = {
        nodes: [
          { id: 'main', label: 'Main Reservoir', type: 'main_reservoir' },
          { id: 'inflow1', label: 'Inflow 1', type: 'inflow' },
          { id: 'inflow2', label: 'Inflow 2', type: 'inflow' },
        ],
        links: [
          { source: 'inflow1', target: 'main' },
          { source: 'inflow2', target: 'main' },
        ],
      };
      
      const { container } = render(<ReservoirGraph data={inflowOnlyData} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should handle data with only outflows', () => {
      const outflowOnlyData: IGraphData = {
        nodes: [
          { id: 'main', label: 'Main Reservoir', type: 'main_reservoir' },
          { id: 'outflow1', label: 'Outflow 1', type: 'outflow' },
          { id: 'outflow2', label: 'Outflow 2', type: 'outflow' },
        ],
        links: [
          { source: 'main', target: 'outflow1' },
          { source: 'main', target: 'outflow2' },
        ],
      };
      
      const { container } = render(<ReservoirGraph data={outflowOnlyData} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should handle data with only projects', () => {
      const projectOnlyData: IGraphData = {
        nodes: [
          { id: 'main', label: 'Main Reservoir', type: 'main_reservoir' },
          { id: 'project1', label: 'Project 1', type: 'project' },
          { id: 'project2', label: 'Project 2', type: 'project' },
        ],
        links: [
          { source: 'main', target: 'project1' },
          { source: 'main', target: 'project2' },
        ],
      };
      
      const { container } = render(<ReservoirGraph data={projectOnlyData} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should handle data with mixed node types', () => {
      const mixedData: IGraphData = {
        nodes: [
          { id: 'main', label: 'Main Reservoir', type: 'main_reservoir' },
          { id: 'inflow1', label: 'Inflow 1', type: 'inflow' },
          { id: 'inflow2', label: 'Inflow 2', type: 'inflow' },
          { id: 'outflow1', label: 'Outflow 1', type: 'outflow' },
          { id: 'outflow2', label: 'Outflow 2', type: 'outflow' },
          { id: 'project1', label: 'Project 1', type: 'project' },
          { id: 'project2', label: 'Project 2', type: 'project' },
        ],
        links: [
          { source: 'inflow1', target: 'main' },
          { source: 'inflow2', target: 'main' },
          { source: 'main', target: 'outflow1' },
          { source: 'main', target: 'outflow2' },
          { source: 'main', target: 'project1' },
          { source: 'main', target: 'project2' },
        ],
      };
      
      const { container } = render(<ReservoirGraph data={mixedData} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should handle data updates', () => {
      const { rerender, container } = render(<ReservoirGraph data={mockData} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      
      const newData: IGraphData = {
        nodes: [
          { id: 'main2', label: 'New Main Reservoir', type: 'main_reservoir' },
          { id: 'inflow3', label: 'New Inflow', type: 'inflow' },
        ],
        links: [
          { source: 'inflow3', target: 'main2' },
        ],
      };
      
      rerender(<ReservoirGraph data={newData} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have proper container structure', () => {
      const { container } = render(<ReservoirGraph data={mockData} />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ position: 'relative' });
      expect(wrapper).toHaveStyle({ width: '100%' });
      expect(wrapper).toHaveStyle({ height: '100%' });
    });

    it('should have zoom controls positioned correctly', () => {
      const { container } = render(<ReservoirGraph data={mockData} />);
      
      // Find the zoom controls container (the div with absolute positioning)
      const zoomControls = Array.from(container.querySelectorAll('div')).find(
        div => div.style.position === 'absolute'
      ) as HTMLElement;
      
      expect(zoomControls).toBeTruthy();
      expect(zoomControls).toHaveStyle({ position: 'absolute' });
      expect(zoomControls).toHaveStyle({ bottom: '20px' });
      expect(zoomControls).toHaveStyle({ left: '20px' });
    });

    it('should have SVG with correct background color', () => {
      const { container } = render(<ReservoirGraph data={mockData} />);
      const svg = container.querySelector('svg') as SVGElement;
      
      expect(svg).toHaveStyle({ background: '#F5F5F0' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle nodes without main reservoir', () => {
      const noMainData: IGraphData = {
        nodes: [
          { id: 'inflow1', label: 'Inflow 1', type: 'inflow' },
          { id: 'outflow1', label: 'Outflow 1', type: 'outflow' },
        ],
        links: [],
      };
      
      const { container } = render(<ReservoirGraph data={noMainData} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should handle links with missing nodes', () => {
      const invalidLinksData: IGraphData = {
        nodes: [
          { id: 'main', label: 'Main Reservoir', type: 'main_reservoir' },
        ],
        links: [
          { source: 'nonexistent', target: 'main' },
          { source: 'main', target: 'alsoNonexistent' },
        ],
      };
      
      const { container } = render(<ReservoirGraph data={invalidLinksData} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should handle very long node labels', () => {
      const longLabelData: IGraphData = {
        nodes: [
          { 
            id: 'main', 
            label: 'This is a very long reservoir name that should be handled properly by the text wrapping functionality', 
            type: 'main_reservoir' 
          },
        ],
        links: [],
      };
      
      const { container } = render(<ReservoirGraph data={longLabelData} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should handle single node', () => {
      const singleNodeData: IGraphData = {
        nodes: [
          { id: 'main', label: 'Main Reservoir', type: 'main_reservoir' },
        ],
        links: [],
      };
      
      const { container } = render(<ReservoirGraph data={singleNodeData} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets', () => {
      const largeData: IGraphData = {
        nodes: [
          { id: 'main', label: 'Main Reservoir', type: 'main_reservoir' },
          ...Array.from({ length: 50 }, (_, i) => ({
            id: `inflow${i}`,
            label: `Inflow ${i}`,
            type: 'inflow' as const,
          })),
          ...Array.from({ length: 50 }, (_, i) => ({
            id: `outflow${i}`,
            label: `Outflow ${i}`,
            type: 'outflow' as const,
          })),
        ],
        links: [
          ...Array.from({ length: 50 }, (_, i) => ({
            source: `inflow${i}`,
            target: 'main',
          })),
          ...Array.from({ length: 50 }, (_, i) => ({
            source: 'main',
            target: `outflow${i}`,
          })),
        ],
      };
      
      const { container } = render(<ReservoirGraph data={largeData} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Button Styling', () => {
    it('should have consistent button styles', () => {
      render(<ReservoirGraph data={mockData} />);
      
      const buttons = [
        screen.getByTitle('Zoom In'),
        screen.getByTitle('Zoom Out'),
        screen.getByTitle('Reset Zoom'),
      ];
      
      buttons.forEach(button => {
        expect(button).toHaveStyle({ width: '36px' });
        expect(button).toHaveStyle({ height: '36px' });
        expect(button).toHaveStyle({ borderRadius: '4px' });
        expect(button).toHaveStyle({ cursor: 'pointer' });
      });
    });

    it('should display correct button symbols', () => {
      render(<ReservoirGraph data={mockData} />);
      
      expect(screen.getByTitle('Zoom In')).toHaveTextContent('+');
      expect(screen.getByTitle('Zoom Out')).toHaveTextContent('−');
      expect(screen.getByTitle('Reset Zoom')).toHaveTextContent('⊙');
    });
  });
});
