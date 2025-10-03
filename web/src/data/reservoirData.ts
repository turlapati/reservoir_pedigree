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

// Sample data object
export const reservoirData: IGraphData = {
  nodes: [
    // --- Central Node ---
    { id: 'emerald_lake', label: 'Emerald Lake', type: 'main_reservoir' },

    // --- Inflows (Left side) ---
    { id: 'whispering_river', label: 'Whispering River', type: 'inflow' },
    { id: 'stone_creek', label: 'Stone Creek', type: 'inflow' },
    { id: 'clearwater_reservoir', label: 'Clearwater Reservoir', type: 'inflow' },

    // --- Outflows (Right side) ---
    { id: 'sunset_basin', label: 'Sunset Basin', type: 'outflow' },
    { id: 'valley_canal', label: 'Valley Canal', type: 'outflow' },

    // --- Projects (Right side) ---
    { id: 'hydro_dam', label: 'Hydroelectric Dam', type: 'project' },
    { id: 'lake_fisheries', label: 'Lake Fisheries Inc.', type: 'project' },
    { id: 'recreation_area', label: 'Public Rec. Area', type: 'project' },
  ],
  links: [
    // --- Inflows to Main Reservoir ---
    { source: 'whispering_river', target: 'emerald_lake' },
    { source: 'stone_creek', target: 'emerald_lake' },
    { source: 'clearwater_reservoir', target: 'emerald_lake' },

    // --- Main Reservoir to Outflows ---
    { source: 'emerald_lake', target: 'sunset_basin' },
    { source: 'emerald_lake', target: 'valley_canal' },

    // --- Main Reservoir to Projects ---
    { source: 'emerald_lake', target: 'hydro_dam' },
    { source: 'emerald_lake', target: 'lake_fisheries' },
    { source: 'emerald_lake', target: 'recreation_area' },
  ],
};
