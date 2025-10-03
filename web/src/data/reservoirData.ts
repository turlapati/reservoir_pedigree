import reservoirDataJson from './reservoirData.json';

// Define the interfaces for type safety
export interface INode {
  id: string;
  label: string;
  type: 'main_reservoir' | 'inflow' | 'outflow' | 'project';
  fx?: number; // Optional fixed x position
  fy?: number; // Optional fixed y position
}

export interface ILink {
  source: string;
  target: string;
}

export interface IGraphData {
  nodes: INode[];
  links: ILink[];
}

export interface ReservoirConfig {
  reservoir_id: number;
  reservoir_name: string;
  inflow: string;
  outflow: string;
  projects: string;
}

/**
 * Parse a reservoir configuration from JSON into graph data format
 */
export function parseReservoirConfig(config: ReservoirConfig): IGraphData {
  const nodes: IGraphData['nodes'] = [];
  const links: IGraphData['links'] = [];

  // Create main reservoir node (use reservoir_id as unique id)
  const mainNodeId = `reservoir_${config.reservoir_id}`;
  nodes.push({
    id: mainNodeId,
    label: config.reservoir_name,
    type: 'main_reservoir',
  });

  // Parse and add inflow nodes
  if (config.inflow && config.inflow.trim()) {
    const inflows = config.inflow.split(',').map((s) => s.trim());
    inflows.forEach((inflow, index) => {
      const inflowId = `inflow_${config.reservoir_id}_${index}`;
      nodes.push({
        id: inflowId,
        label: inflow,
        type: 'inflow',
      });
      links.push({
        source: inflowId,
        target: mainNodeId,
      });
    });
  }

  // Parse and add outflow nodes
  if (config.outflow && config.outflow.trim()) {
    const outflows = config.outflow.split(',').map((s) => s.trim());
    outflows.forEach((outflow, index) => {
      const outflowId = `outflow_${config.reservoir_id}_${index}`;
      nodes.push({
        id: outflowId,
        label: outflow,
        type: 'outflow',
      });
      links.push({
        source: mainNodeId,
        target: outflowId,
      });
    });
  }

  // Parse and add project nodes
  if (config.projects && config.projects.trim()) {
    const projects = config.projects.split(',').map((s) => s.trim());
    projects.forEach((project, index) => {
      const projectId = `project_${config.reservoir_id}_${index}`;
      nodes.push({
        id: projectId,
        label: project,
        type: 'project',
      });
      links.push({
        source: mainNodeId,
        target: projectId,
      });
    });
  }

  return { nodes, links };
}

/**
 * Get all available reservoir configurations
 */
export function getAllReservoirs(): ReservoirConfig[] {
  return reservoirDataJson as ReservoirConfig[];
}

/**
 * Get a specific reservoir configuration by ID
 */
export function getReservoirById(id: number): ReservoirConfig | undefined {
  return reservoirDataJson.find((r) => r.reservoir_id === id);
}
